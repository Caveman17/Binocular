'use strict';

import ChartComponent from './chart/chart.js';
import ConfigComponent from './config.js';
/*import HelpComponent from './help.js';
import saga from './sagas';*/
import reducer from './reducers';

export default {
  id: 'CoChangeGraph',
  label: 'Co-Change Graph',
  saga: null, //saga,
  reducer,
  ChartComponent,
  ConfigComponent,
  //HelpComponent
};
