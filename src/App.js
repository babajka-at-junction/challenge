import React, { useEffect } from "react";
import ReactMapboxGl, { Marker, ZoomControl } from "react-mapbox-gl";
import Drawer from "@material-ui/core/Drawer";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import Slider from "@material-ui/core/Slider";
import CircularProgress from "@material-ui/core/CircularProgress";
import Box from "@material-ui/core/Box";
import { createMuiTheme } from "@material-ui/core/styles";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import { SingleDatePicker } from "react-dates";
import axios from "axios";
import _ from "lodash";
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import moment from "moment";

import { MAPBOX_ACCESS_TOKEN } from "./consts";
import counters from "./counters.json";
import "./App.css";

const API_HOST = 'http://10.100.57.184:8080'
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

const drawerWidth = 350;

const useStyles = makeStyles(theme => ({
  appBar: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0
  },
  drawerPaper: {
    width: drawerWidth
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  },
  tabs: {
    backgroundColor: "white"
  }
}));

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`
  };
}

const CustomTab = withStyles(theme => ({
  root: {
    width: 175,
    fontSize: theme.typography.pxToRem(14)
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
    [24.4562897491, 60.2758196349],
    [24.550391009, 60.3307308136]
  ]
};

const COORD_BY_PARK = {
  nuuksio: { lat: 60.249999, lon: 24.5999976},
  pallas: { lat: 68.158889, lon: 24.040278 }
}

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
  const [value, setValue] = React.useState("nuuksio");
  const [timeRange, setTimeRange] = React.useState(TIME_RANGES[0].value);
  const [date, setDate] = React.useState(moment(new Date(2018, 9, 7)));
  const [focused, setFocused] = React.useState(false);
  const [hourRange, setHourRange] = React.useState(14);
  const [isLoading, setIsLoading] = React.useState(false);
  const [fetchedData, setFetchedData] = React.useState(null);
  const [sunData, setSun] = React.useState(null);

  const fetchSun = d => {
    const {lat, lon} = COORD_BY_PARK[value]
    axios
      .get(`https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${d.format("YYYY-MM-DD")}&formatted=0`)
      .then(res => {
        setSun(res.data.results);
      })
  }

  const fetchData = d => {
    setIsLoading(true);
    axios
      .get(`${API_HOST}/api/visits/${d.format("YYYY/MM/DD")}`)
      .then(async function(response) {
        // handle success
        console.log(response);
        setFetchedData(response.data);
      })
      .catch(function(error) {
        // handle error
        console.log(error);
      })
      .finally(function() {
        // always executed
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchData(date);
    fetchSun(date);
  }, []);

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

  const changeDate = date => {
    setDate(date);
    fetchData(date);
    fetchSun(date);
  };

  console.log('sunData', sunData);

  return (
    <div>
      <AppBar position="fixed" className={classes.appBar}>
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
              m.fitBounds(BOUNDS_BY_PARK[value], {
                padding: { left: 170, right: 20, top: 20, bottom: 20 }
              });
            }
          }}
        >
          <ZoomControl />
          {newCounters.map(c => {
            const visits =
              fetchedData &&
              fetchedData.dataByCounters &&
              fetchedData.dataByCounters[c._id] &&
              fetchedData.dataByCounters[c._id][hourRange]
                ? fetchedData.dataByCounters[c._id][hourRange]
                : 0;
            const percent = fetchedData
              ? visits < fetchedData.maxVisits
                ? (visits * 100) / fetchedData.maxVisits
                : 100
              : 0;
            const size = sizeByPercent(percent);
            return (
              <Marker
                key={c._id}
                coordinates={[c.long, c.lat]}
                onClick={() => {
                  console.log(55, [c.long, c.lat]);
                }}
              >
                <div
                  style={{
                    backgroundColor: colorByPercent(percent),
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  {visits}
                </div>
              </Marker>
            );
          })}
        </Mapbox>
      </AppBar>
      <Drawer
        className={classes.drawer}
        variant="permanent"
        classes={{
          paper: classes.drawerPaper
        }}
      >
        <AppBar position="static">
          <Box fontSize="h6.fontSize" m={1}>
            Choose National Park
          </Box>
          <Tabs
            className={classes.tabs}
            value={value}
            indicatorColor="primary"
            textColor="primary"
            onChange={(event, newValue) => {
              setValue(newValue);
              fetchSun(date);
              map.current.fitBounds(BOUNDS_BY_PARK[newValue], {
                padding: { left: 170, right: 20, top: 20, bottom: 20 }
              });
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
        <div style={{ margin: "16px" }}>
          {/* <FormControl className={classes.formControl}>
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
          </FormControl> */}
          {sunData && (
            <div>
              <p>sunrise: {moment(new Date(sunData.sunrise)).format('HH:mm')}</p>
              <p>sunset: {moment(new Date(sunData.sunset)).format('HH:mm')}</p>
            </div>)
          }
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 600, marginBottom: "8px" }}>
              Choose day
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between"
              }}
            >
              <SingleDatePicker
                date={date}
                onDateChange={changeDate}
                focused={focused}
                onFocusChange={({ focused }) => {
                  setFocused(focused);
                }}
                id="day-picker"
                numberOfMonths={1}
                isOutsideRange={() => false}
              />
              {isLoading && <CircularProgress />}
            </div>
            <div
              style={{
                fontWeight: 600,
                margin: "16px 0 8px",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between"
              }}
            >
              <div>Choose hour</div>
              <div>{`${hourRange}:00 - ${
                hourRange === 23 ? 0 : hourRange + 1
              }:00`}</div>
            </div>
            <Slider
              value={typeof hourRange === "number" ? hourRange : 0}
              onChange={(event, newValue) => {
                setHourRange(newValue);
              }}
              defaultValue={12}
              aria-labelledby="discrete-slider"
              valueLabelDisplay="off"
              step={1}
              marks
              min={0}
              max={23}
              disabled={isLoading}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}

export default App;
