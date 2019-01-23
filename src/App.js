import React, { Component } from 'react';
import './App.css';
import Webcam from './Webcam';
import { Stitch, RemoteMongoClient, AnonymousCredential } from 'mongodb-stitch-browser-sdk'

class App extends Component {

  constructor(props) {
    super(props)
    const client = Stitch.initializeDefaultAppClient('uploadvideos-wckak');
    const db = client.getServiceClient(RemoteMongoClient.factory, 'mongodb-atlas').db('videos');
    this.state = {
      video: null,
      videos: [],
      webcamVisibility: false,
      client,
      db
    }
    Notification.requestPermission(function(status) {
      console.log('Notification permission status:', status);
    });
  }

  componentDidMount() {
    const client = this.state.client
    const db = this.state.db
    
    client.auth.loginWithCredential(new AnonymousCredential()).then(user =>
      db.collection('videos').find({owner_id: client.auth.user.id}, { limit: 100}).asArray()
    ).then(videos => {
        this.setState({
          video: null, 
          videos
        })
    }).catch(err => {
        console.error(err)
    });
  }
  
  displayNotification = () => {
    if(!('serviceWorker' in navigator)) {
      console.log('sw not supported');
    }
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready
      .then((serviceWorkerRegistration) => {
          serviceWorkerRegistration.pushManager.getSubscription()
          .then((subscription) => {
                console.log('subscription', subscription.toJSON())
          });
          serviceWorkerRegistration.showNotification('Push notifications parecem simples')
      });
    }
  }

  setRef = webcam => {
    this.webcam = webcam;
  };

  showWebcam = () => {
    this.webcam.startCam();
    this.setState({
      webcamVisibility: true
    })
  }

  hideWebcam = () => {
    this.setState({
      webcamVisibility: false
    })
  }

  addVideo = (blobUrl, blob) => {
    var myReader = new FileReader();
    myReader.onloadend = (e) => {
      console.log(e)
      var blob64 = myReader.result;                
      this.setState({
      video: {
        blobUrl,
        blob64
        }
      })
    }
    myReader.readAsDataURL(blob); 
  }

  /*
  sendVideo = () => {
    const data = new FormData();
    data.append('chunks', this.state.video.chunks);
    fetch("http://localhost", {
      mode: 'no-cors',
      method: "POST",
      body: data
    }).then(function (res) {
      if (res.ok) {
        alert("Perfect! ");
      } else if (res.status == 401) {
        alert("Oops! ");
      }
    }, function (e) {
      console.log("error submitting form", e)
    });
  }
  */

  saveVideo = () => {
    const blob64 = this.state.video.blob64;
    const client = this.state.client
    const db = this.state.db
    
    client.auth.loginWithCredential(new AnonymousCredential()).then(user =>
      db.collection('videos').insertOne({owner_id: client.auth.user.id, blob64 } )
    ).then(() =>
      db.collection('videos').find({owner_id: client.auth.user.id}, { limit: 100}).asArray()
    ).then(docs => {
        console.log("Found docs", docs)
        console.log("[MongoDB Stitch] Connected to Stitch")
        this.setState({
          video: null
        })
    }).catch(err => {
        console.error(err)
    });
  }

  render() {
    let videos = this.state.videos.map( (video, index) => {
      if( video.blob64) {
        console.log(video.blob64)
        return <video key={index} src={video.blob64} controls/>
      }

      if( !video.videoChunks) {
        return null;
      }
      
      //let blob = new Blob(atob(video.videoChunks), {type: "video/webm"});
      let blobUrl = 'sdf'
      //let blobUrl = URL.createObjectURL(video.videoBlob);
      return <video key={index} src={blobUrl} controls/>
    })
    return (
      <div className="App">
        <header className="App-header">
          <button onClick={this.displayNotification}>notifica-me</button>
          <button onClick={this.showWebcam}>adicionar video</button>
          <Webcam ref={node => this.webcam = node} onRecord={this.addVideo} visibility={this.state.webcamVisibility} onClose={this.hideWebcam}/>
        </header>
          {this.state.video && (
            <div> 
              <video src={this.state.video.blobUrl} controls/>
              <button onClick={this.saveVideo}>Enviar video</button>
            </div>
          )}
          {videos}
      </div>
    );
  }
}

export default App;
