import React, { Component } from 'react';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props)
    Notification.requestPermission(function(status) {
      console.log('Notification permission status:', status);
    });
  }
  
  displayNotification = () => {
    if(!('serviceWorker' in navigator)) {
      console.log('sw not supported');
    }
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.getRegistration().then(function(reg) {
        reg.showNotification('Hello world!');
      });
    }
  }


  render() {
    return (
      <div className="App">
        <header className="App-header">
          <button onClick={this.displayNotification}>notifica-me</button>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
