import React from 'react';
import ResponsiveAppBar from '../ResponsiveAppBar/index'
import Typography from '@mui/material/Typography';
import './ProfilePage.css';
import Axios from 'axios';
import Box from '@mui/material/Box';
import ProfilePopUp from './editProfile.js';
import Button from '@mui/material/Button';


export default class profile extends React.Component {
  constructor() {
    super();
    this.state = {
      seen: false,
      username: "",
      birthday: "",
      email: "",
      profile_img: "",
      editProfile: false,
    };
  }

  // load user information
  componentDidMount() {
    const currentUser = JSON.parse(localStorage.getItem('user'));

    // store the user in local storage
    Axios.get('http://localhost:3001/getProfile', {
      params: { name: currentUser }
    }).then((response) => {
      this.setState({
        username: response.data[0].username,
        // make the birthday a prettier thing
        birthday: response.data[0].dob.substring(0, response.data[0].dob.toString().indexOf("T")),
        email: response.data[0].email,
        profile_img: response.data[0].image_path,
      })
    }).catch(err => {
      console.log(err);
    });
  }

  toggleProfile = () => {
    this.setState({
      editProfile: !this.state.editProfile,
    });
    // show a drop down for all the avatars
    // get the index of the one the user clicks
    // print avatar[idx]
    // update query
    // reload the window
  }

  render() {
    return (
      <Box>
        <ResponsiveAppBar />
        {/* toggle the pop up to edit */}
        {this.state.editProfile ? <ProfilePopUp username={this.state.username}
        birthday={this.state.birthday} email={this.state.email} 
        photo={this.state.profile_img} toggle={this.toggleProfile} /> : null}

        <Box className="content" >
          <Typography
            variant="h2"
            noWrap
            component="div"
            sx={{ ml: "10px", mt: "15px", display: { xs: 'none', md: 'flex' } }}
          >
            <b > Profile Page </b>
          </Typography>
          <Box
            component="img"
            sx={{
              height: '100%',
              width: '100%',
              maxHeight: { xs: '35vh', md: '35vh' },
              maxWidth: { xs: '35vh', md: '35vh' },
            }}
            alt={this.state.username}
            src={this.state.profile_img}
          />
          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{ ml: "10px", mt: "15px", display: { xs: 'none', md: 'flex' } }}
          >
            Username: {this.state.username}
          </Typography>
          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{ ml: "10px", mt: "15px", display: { xs: 'none', md: 'flex' } }}
          >
            Email: {this.state.email}
          </Typography>
          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{ ml: "10px", mt: "15px", display: { xs: 'none', md: 'flex' } }}
          >
            Birthday: {this.state.birthday}
          </Typography>
          <br />
          <Button onClick={this.toggleProfile}>
            Edit Information
          </Button>
        </Box>
      </Box>
    );
  }
}


