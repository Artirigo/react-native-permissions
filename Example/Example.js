/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  StyleSheet,
  TouchableHighlight,
  Text,
  View,
  ScrollView,
  Alert,
  AppState,
  Platform,
} from 'react-native';

import Permissions from 'react-native-permissions';

const locationTypes = ['both', 'whenInUse', 'always'];

export default class Example extends Component {
  state = {
    types: [],
    locations: {
      whenInUse: 'undetermined',
      always: 'undetermined',
      both: 'undetermined',
    },
    status: {},
  };

  componentDidMount() {
    let types = [...Permissions.getPermissionTypes()];
    types.splice(types.indexOf('location'), 1);
    this.setState({ types });
    this._updatePermissions(types);
    AppState.addEventListener('change', this._handleAppStateChange.bind(this));
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange.bind(this));
  }

  //update permissions when app comes back from settings
  _handleAppStateChange(appState) {
    if (appState == 'active') {
      this._updatePermissions(this.state.types);
    }
  }

  _openSettings() {
    return Permissions.openSettings()
      .then(() => alert('back to app!!'))
  }

  _updatePermissions(types) {
    let status = {};
    const locations = {
      whenInUse: 'undetermined',
      always: 'undetermined',
      both: 'undetermined',
    };
    Permissions.checkMultiplePermissions(types)
      .then(updatedStatus => {
        status = updatedStatus;
      })
      .then(() =>
        Permissions.getPermissionStatus('location', 'whenInUse')
          .then(res => {
            console.log('!! location whenInUse is', res);
            locations['whenInUse'] = res;
          })
          .then(() =>
            Permissions.getPermissionStatus('location', 'always').then(res => {
              console.log('!! location always is', res);
              locations['always'] = res;
            }))
          .then(() =>
            Permissions.getPermissionStatus('location', 'both').then(res => {
              console.log('!! location both is', res);
            })))
      .then(() => {
        this.setState({ locations, status });
      });
  }

  _requestPermission(permission, options) {
    console.log(`request >${permission}< with the following options`, options);

    Permissions.requestPermission(permission, options)
      .then(res => {
        if (permission === 'location') {
          this.setState({
            locations: {
              ...this.state.locations,
              [options]: res,
            },
          });
        } else {
          this.setState({
            status: { ...this.state.status, [permission]: res },
          });
        }
        if (res != 'authorized') {
          Alert.alert(
            'Whoops!',
            'There was a problem getting your permission. Please enable it from settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: Permissions.openSettings },
            ],
          );
        }
      })
      .catch(e => console.warn(e));
  }

  render() {
    return (
      <ScrollView>
        <View style={styles.container}>
          {Platform.OS === 'ios'
            ? Object.keys(this.state.locations).map(l => (
                <TouchableHighlight
                  style={[styles.button, styles[this.state.locations[l]]]}
                  key={l}
                  onPress={this._requestPermission.bind(this, 'location', l)}
                >
                  <View>
                    <Text style={styles.text}>
                      {`location - ${l}`}
                    </Text>
                    <Text style={styles.subtext}>
                      {this.state.locations[l]}
                    </Text>
                  </View>
                </TouchableHighlight>
              ))
            : <TouchableHighlight
                style={[styles.button, styles[this.state.status[p]]]}
                key={p}
                onPress={this._requestPermission.bind(this, p)}
              >
                <View>
                  <Text style={styles.text}>location</Text>
                  <Text style={styles.subtext}>
                    {this.state.status[p]}
                  </Text>
                </View>
              </TouchableHighlight>}
          {this.state.types.map(p => (
            <TouchableHighlight
              style={[styles.button, styles[this.state.status[p]]]}
              key={p}
              onPress={this._requestPermission.bind(this, p)}
            >
              <View>
                <Text style={styles.text}>
                  {p}
                </Text>
                <Text style={styles.subtext}>
                  {this.state.status[p]}
                </Text>
              </View>
            </TouchableHighlight>
          ))}
          <View style={styles.footer}>
            <TouchableHighlight onPress={Permissions.openSettings}>
              <Text style={styles.text}>Open settings</Text>
            </TouchableHighlight>
          </View>

          <Text style={styles['footer_' + Platform.OS]}>
            Note: microphone permissions may not work on iOS simulator. Also, toggling permissions from the settings menu may cause the app to crash. This is normal on iOS. Google "ios crash permission change"
          </Text>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
    padding: 10,
  },
  text: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtext: {
    textAlign: 'center',
  },
  button: {
    margin: 5,
    borderColor: 'black',
    borderWidth: 3,
    overflow: 'hidden',
  },
  buttonInner: {
    flexDirection: 'column',
  },
  undetermined: {
    backgroundColor: '#E0E0E0',
  },
  authorized: {
    backgroundColor: '#C5E1A5',
  },
  denied: {
    backgroundColor: '#ef9a9a',
  },
  restricted: {
    backgroundColor: '#FFAB91',
  },
  footer: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer_android: {
    height: 0,
    width: 0,
  },
});
