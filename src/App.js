import React from "react";
import ReactMapboxGl, {
  Marker,
  Layer,
  Feature,
  ZoomControl
} from "react-mapbox-gl";
import Drawer from "@material-ui/core/Drawer";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import { DayPickerSingleDateController } from "react-dates";
import _ from "lodash";

import { MAPBOX_ACCESS_TOKEN } from "./consts";
import counters from "./counters.json";
import "./App.css";

const STYLE_PREFIX = "mapbox://styles/uladbohdan";

export const LIGHT_STYLE = `${STYLE_PREFIX}/ck30op2jk14fd1cmwszi4vksy`;

const Mapbox = ReactMapboxGl({
  accessToken: MAPBOX_ACCESS_TOKEN,
  logoPosition: "bottom-right"
});

export const FINLAND_BOUNDS = [
  [31.5160921567, 70.1641930203],
  [20.6455928891, 59.846373196]
];

const useStyles = makeStyles(theme => ({
  drawer: {
    width: 240,
    flexShrink: 0
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  },
  test: {}
}));

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`
  };
}

const CustomTab = withStyles(theme => ({
  root: {
    width: 75,
    fontSize: theme.typography.pxToRem(10)
  }
}))(props => <Tab disableRipple {...props} />);

const TIME_RANGES = [
  { value: "hour", label: "Hour" },
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" }
];

const BOUNDS_BY_PARK = {
  pallas: [
    [23.72163147713274, 68.34311219518555],
    [24.570993475020224, 67.54100460419077]
  ],
  nuuksio: [
    [24.698307563459547, 60.24969716104745],
    [24.447281862291263, 60.3307308136045]
  ]
};

const RED = 0;
const GREEN = 120;

const colorByPercent = (percent, start = RED, end = GREEN) => {
  const delta = (end - start) * (100 - percent / 100);
  const hue = start + delta;
  return `hsl(${hue}, 80%, 50%)`;
};

const sizeByPercent = (percent, start = 20, end = 30) => {
  const delta = (end - start) * ((100 - percent) / 100);
  const hue = start + delta;
  return `${hue}px`;
};

function App() {
  const classes = useStyles();
  const [value, setValue] = React.useState("pallas");
  const [timeRange, setTimeRange] = React.useState(TIME_RANGES[0].value);

  const maxVisits = _.maxBy(counters, "value.visits").value.visits;

  const map = React.useRef();

  const newCounters = counters.sort((a, b) => {
    if (a.value.visits > b.value.visits) {
      return 1;
    } else if (a.value.visits === b.value.visits) {
      return 0;
    } else {
      return -1;
    }
  });

  return (
    <div>
      <Mapbox
        style={LIGHT_STYLE}
        containerStyle={{
          position: "fixed",
          left: 150,
          top: 0,
          bottom: 0,
          right: 0
        }}
        fitBounds={FINLAND_BOUNDS}
        onSourceDataLoading={m => {
          if (!map.current) {
            map.current = m;
            m.fitBounds(BOUNDS_BY_PARK.pallas, { padding: 20 });
          }
        }}
      >
        <ZoomControl />
        {newCounters.map(c => {
          const percent = (c.value.visits * 100) / maxVisits;
          const size = sizeByPercent(percent);
          return (
            <Marker key={c._id} coordinates={[c.long, c.lat]}>
              <div
                style={{
                  backgroundColor: colorByPercent(percent),
                  width: size,
                  height: size,
                  borderRadius: "50%"
                }}
              >{c.value.visits}</div>
            </Marker>
          );
        })}
      </Mapbox>
      <Drawer className={classes.drawer} open={true} variant="permanent">
        <AppBar position="static">
          <Tabs
            value={value}
            onChange={(event, newValue) => {
              setValue(newValue);
              map.current.fitBounds(BOUNDS_BY_PARK[newValue], { padding: 20 });
            }}
          >
            <CustomTab
              label="Pallas-Yllästunturi"
              value="pallas"
              {...a11yProps("pallas")}
            />
            <CustomTab
              label="Nuuksio"
              value="nuuksio"
              {...a11yProps("nuuksio")}
            />
          </Tabs>
        </AppBar>
        <div>
          <FormControl className={classes.formControl}>
            <InputLabel id="demo-simple-select-label">Time Range</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={timeRange}
              onChange={event => {
                setTimeRange(event.target.value);
              }}
            >
              {TIME_RANGES.map(tr => (
                <MenuItem value={tr.value} key={tr.value}>
                  {tr.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {timeRange === "day" && <DayPickerSingleDateController />}
        </div>
      </Drawer>
    </div>
  );
}

export default App;
