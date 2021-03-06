import ResponsiveAppBar from '../ResponsiveAppBar/index'
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import PQPopUp from './PQPopUp';
import * as React from 'react';
import MovieReview from './MovieReview';
import PreferencesStats from './PreferenceStat';
import ClearConfirm from './clearConfirm';

// styling for horizontal list
const flexContainer = {
  display: 'flex',
  flexDirection: 'row',
  padding: 0,
};


// display current preferences at the bottom of the page
export default class Preferences extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      qSeen: false,
      mrSeen: false,
      chart: true,
      
    };
  }

  // methods to toggle pop ups
  togglePQ = () => {
    this.setState({
      pqSeen: !this.state.pqSeen,
    });
    this.toggleChart();
  };

  toggleMR = () => {
    this.setState({
      mrSeen: !this.state.mrSeen,
    });
    this.toggleChart();
  };

  toggleChart = () => {
    this.setState({
      chart: !this.state.chart,
    });
  };

 
  render() {
    const curr_user = JSON.parse(localStorage.getItem('user'));
    return (
      <>
        <ResponsiveAppBar currentUser = {curr_user} />
        <Box position="static">
          {/* preference quiz button */}
          <Button
            onClick={this.togglePQ}
            sx={{ ml: "15px", mt: "10px", position: 'absolute', right: 200 }}
          >
            Take Preferences Quiz
          </Button>
          {this.state.pqSeen ? <PQPopUp toggle={this.togglePQ}/> : null}

          {/* movie search button */}
          <Button
            onClick={this.toggleMR}
            sx={{ right: 10, mt: "10px", position: 'absolute' }}
          >
            Rapid Movie Review
          </Button>
          {this.state.mrSeen ? <MovieReview toggle={this.toggleMR} /> : null}

          {/* saved preferences section */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ ml: "15px", mt: "20px", display: { xs: 'none', md: 'flex' } }}
          >
            My Current Preferences
          </Typography>
          
          {this.state.chart ? <PreferencesStats style={flexContainer} className='center-screen'/> : null}
          
          {/* if agree should wipe if not just exit */}
          <ClearConfirm className='center-screen' clear={this.clear}/>
          
        </Box>

      </>
    );
  }
}
