
require 'grpc'
require 'api/language.service_services_pb'
require 'service/i_service'


module Binocular
  module Service
    class LanguageService < Binocular::Comm::LanguageDetectionService::Service
      include Binocular::Service::ILanguageService
      
      # initialises all needed data
      # @param [Binocular::Config] config contains the merged config file data
      # @param [Binocular::Service::IRegistrationService] register contains the gateway communication service
      # @param [GRPC::RpcServer] rpc_service contains the grpc server
      def initialize(config, register, rpc_service)
        @register = register
        @rpc_service  = rpc_service
        @config = config

        @server_address = "0.0.0.0:#{config.data.dig('languageService','port')}"
        @rpc_service.add_http2_port(@server_address, :this_port_is_insecure)
        @rpc_service.handle(self)
        @logger = Logger.new(config.data.dig('languageService','logger', 'file'))
        @logger.level = Logger::Severity.const_get(config.data.dig('languageService','logger', 'level'))
      end

      # start the language detection service to listen for grpc requests
      def start
        @logger.info("Start language service listening on #{@server_address}")
        @rpc_service.run_till_terminated_or_interrupted([1, 'int', 'SIGQUIT'])
        @logger.info("Stopped language service...")
      end

      def stop
        @rpc_service.stop
      end

      # receives the file and its content from the gateway
      # @param [Binocular::Comm::LanguageDetectionRequest] request contains a given file and its content
      def detect_languages(request, _unused_call)
        if @register.token == request.token
          begin
            @logger.info("Processing #{request.path}")
            generated = Linguist::Generated.generated?(request.path, request.content)

            if generated
              @logger.info("#{request.path} is a generated file!")
              return nil
            end

            # file is to small to detect
            if request.content.length < 15
              @logger.info("#{request.path} is too small!")
              return nil
            end

            fileBlob = Linguist::Blob.new(request.path, request.content)
            language = Linguist.detect(fileBlob)
            if language.nil?
              return nil
            end

            detect_event = Linguist.instrumenter.events.last
            detect_event_payload = detect_event[:args].first

            @logger.info("#{request.path} processed successfully")
            if language.group.nil?
              return Binocular::Comm::Language.new(
                  :id =>  language.group.language_id,
              :name => language.group.name,
              :popular => language.group.popular?,
              :aliases => language.group.aliases,
              :color => language.group.color
              )
            end
            return Binocular::Comm::Language.new(
              :id => language.language_id,
              :name => language.name,
              :popular => language.popular?,
              :aliases => language.aliases,
              :color => language.color
            )
          rescue
            error = $!
            @logger.error(error.message)
            return nil
          end
        end
        raise GRPC::BadStatus.new(GRPC::Core::StatusCodes::INVALID_ARGUMENT, "The provided token does not match with the one provided by the gateway!")
      end

      # disconnects this service if the token is equal
      # @param [Binocular::Comm::UnregisterRequest] request contains the token that has to be equal to the register token received from the gateway once
      def disconnect(request, _unused_call)
        if @register.token == request.token
          @register.disconnect
          return Binocular::Comm::UnregisterResponse.new
        end
        raise GRPC::BadStatus.new(GRPC::Core::StatusCodes::INVALID_ARGUMENT, "The provided token does not match with the one provided by the gateway!")
      end
    end
  end
end
