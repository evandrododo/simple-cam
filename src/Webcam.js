import React, {
    Component
} from 'react';
import './webcam.scss';
import FaStop from 'react-icons/fa/stop';
import FaTimes from 'react-icons/fa/times';
import FaExchangeAlt from 'react-icons/fa/exchangealt';

class Webcam extends Component {

    setRef = preview => {
        this.preview = preview;
    };

    constructor(props) {
        super(props);
        this.state = {
            record: false,
            videoRecorder: null,
            dataRecorded: null,
            mediaDevices: [],
            facingMode: 'environment',
            log: ''
        }
    }

    startRecording = () => {
        let videoRecorder = new MediaRecorder(this.preview.captureStream());
        let dataRecorded = [];

        videoRecorder.ondataavailable = event => dataRecorded.push(event.data);
        videoRecorder.start();
        this.setState({
            record: true,
            videoRecorder,
            dataRecorded,
        });
    }

    stopRecording = () => {
        this.preview.srcObject.getTracks().forEach(track => track.stop());
        let videoRecorder = this.state.videoRecorder;
        let stopped = new Promise((resolve, reject) => {
            videoRecorder.onstop = resolve;
            videoRecorder.onerror = event => reject(event.name);
        });

        videoRecorder.stop()
        let recorded = () => {
            videoRecorder.stop()
            this.setState({
                videoRecorder
            });
            return videoRecorder.state === "recording";
        }
        return Promise.all([
                stopped,
                recorded
            ])
            .then(() => this.state.dataRecorded);
    }

    saveRecord = () => {
        this.stopRecording()
        .then(recordedChunks => {
            this.setState({
                log: this.state.log+" - recordedchunks:"+recordedChunks.length
            });
            let recordedBlob = new Blob(recordedChunks, {
                type: "video/webm"
            });
            let blobUrl = URL.createObjectURL(recordedBlob);

            if(this.props.onRecord) {
                this.props.onRecord(blobUrl, recordedBlob)
            }
            this.setState({
                record: false,
            });
            this.closeWebcam();
        })
        .catch( error => {
        });
    }

    startCam = () => {
        navigator.mediaDevices.enumerateDevices()
        .then( devices => {
            let mediaDevices = [];
            devices.forEach( device => {
                if(device.kind === 'videoinput') {
                    mediaDevices.push(device);
                    console.log(device);
                }
            })
            this.setState({
                mediaDevices,
                selectedDevice: mediaDevices[0]
            })

            var constraints = {
                audio: true, 
                video: {
                    facingMode: this.state.facingMode
                }
            };
            navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                this.preview.srcObject = stream;
                this.preview.captureStream = this.preview.captureStream || this.preview.mozCaptureStream;
            });
        });
    }

    nextDevice = () => {
        const facingMode = this.state.facingMode === 'environment' ? 'user' : 'environment';
        this.setState({
            facingMode
        })

        if(this.preview.srcObject) {
            this.preview.srcObject.getTracks().forEach(track => track.stop());
        }
        const constraints = {
            audio: true,
            video: {
                facingMode: this.state.facingMode
            }
        }
            this.setState({
                log: this.state.log+" - facingMode: "+JSON.stringify(constraints)
            });
        navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            this.preview.srcObject = stream;
            this.preview.captureStream = this.preview.captureStream || this.preview.mozCaptureStream;
        });
    }

    closeWebcam = () => {
        if (this.props.onClose) this.props.onClose();
    }

    render() {
        return <div className={this.props.visibility ? 'webcam-component':'webcam-component hidden'}>
            <video ref={node => this.preview = node}  muted="muted" width="100%" height="100%" autoPlay={true}></video>
            <button className="close-btn" onClick={this.closeWebcam}><FaTimes/></button>
            <div className="cam-controls">
                <div className="btn-record">
                    { !this.state.record && (
                    <button className="record" onClick={this.startRecording} type="button">&nbsp;</button>
                    )}
                    { this.state.record && (
                    <button className="stop-record" onClick={this.saveRecord} type="button"><FaStop/></button>
                    )}
                </div>
                { this.state.mediaDevices.length > 2 &&(
                <button className="change-record" onClick={this.nextDevice} type="button"><FaExchangeAlt/></button>
                )}
            </div>
        </div>
    }
}

export default Webcam;