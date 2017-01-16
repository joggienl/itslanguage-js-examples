# ITSLanguage JavaScript SDK Examples

Welcome to the ITSLanguage Example project. This project contains examples for
the [ITSLanguage JavaScript SDK](https://www.npmjs.com/package/itslanguage).
You can use these examples as a reference guide to how you will use the SDK in your own website.

View and interact with live demos of the recording, analysis and recognition functionality of the SDK on our [GitHub Pages site!](https://itslanguage.github.io/itslanguage-js-examples/)

## Getting Started

You can view the code in the files contained in this project, or run the project in a local server
and interact with the examples. These instructions will get the project up and running on your local machine.

### Installation

Navigate to wherever you have stored the project.

```sh
$ cd examples
```

Install all required packages using [npm](https://www.npmjs.com/)

```sh
$ npm install
```

Run the project

```sh
$ npm start
```

By default, the project will be accessible on localhost:3000.

## API Reference

The demos contained in this project detail the streaming use cases that are possible with the ITSLanguage SDK. This includes 
speech recording, speech analysis and speech recognition. A sample implementation of audio players and recorder are also available
to use. You are free to copy this.
Should you want to create your own implementation see the SDK Docs on the audio players and audio recorders.

The SDK uses [ES6](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)
and [WhenJS Promises](https://github.com/cujojs/when) to deliver information and any error messages to you.
See their documentation for more information.

Some sample use cases are available below.

## Examples

### Connection

#### REST
In order to use the ITSLanguage SDK you will need to connect to both the REST server and the
websocket server using a `Connection` object.

To create a `Connection` object, you will need to submit the URL of the REST API, the URL of the websocket server,
a login name and password in a JSON object:
```javascript
information = {
    apiUrl: <RESTurl>,
    wsUrl: <websocketUrl>
}
```
You will then need to create a `Connection` object with this data as parameter.
```javascript
its = require('itslanguage');
connection = new its.Connection(information);
```

#### Websocket

To connect to the websocket server you will need to request an OAuth2 token from our server. For more information see the [REST API
documentation](https://itslanguage.github.io/itslanguage-docs/)
```javascript
tenant = new its.Tenant('1', 'John');
basicAuth = new its.BasicAuth(tenant.name);
sdk = new its.AdministrativeSDK(connection);
sdk.createBasicAuth(basicAuth)
    .then(result => {
        basicAuth = result;
    });
```

Then it's a simple matter of requesting a token and using it to connect to the websocket server.
```javascript
connection.getOauth2Token(basicAuth)
    .then(() => connection.webSocketConnect());
```
For information on how to listen if the connection was successful or not, see the examples in the project.

### REST Examples

All of the REST use cases are quite simple. The workflow goes like this:
1. Create the object that you need processed.
3. Use the AdministrativeSDK object.
4. Use the results.

To create a new Student in our database:
```javascript
student = new its.Student(<parameters>);
sdk = new its.AdministrativeSDK(connection);
sdk.createStudent(student)
    .then(result => console.log('Success! Got ' + result));
    .catch(error => console.log('Encountered error ' + error + '!'));
```
A successful result will in this case return the object you submitted with the new properties `created` and `updated`.
Sometimes an id can also be generated.
A rejected result is an object with either a `message` string or an `errors` object with detailed errors.
For more information read the SDK Docs.

## Streaming

To stream audio, an HTML component along with backing JavaScript will need to be registered with the SDK. It may be difficult for
you to create, so we have supplied our own implementation free for use.
Nevertheless, to register a component with the SDK:
```javascript
itsRecorder = new its.AudioRecorder({forceWave: true});   //Internal representation of an audio recorder. Force wave format recording.
recorderDiv = document.getElementById('recorder');        //Div of the custom HTML element representing a recorder.
recorderUI = new uicomps.Recorder({                       //uicomps is a home made library that links HTML elements to the internal audio functionality.
  element: GUIrecorder,
  recorder: itsRecorder,
  maxRecordingDuration: 200
});
```
An audio player can also be registered together with the Recorder.
```javascript
recorderUI.player = new its.AudioPlayer();
```
A volume meter can also be bound to the recorder. See the examples.

To start streaming audio for recording, recognition or analysis you will need to create a `Challenge` to accompany
the incoming recording.
```javascript
challenge = new its.SpeechChallenge('fb');
challenge.topic = 'ExamQuestion4';
sdk = new its.AdministrativeSDK(connection);
sdk.createSpeechChallenge(challenge)
    .then(result => {
        challenge = result;
        })
    .catch(error => {
        console.log(error.message);
        });
```
And then start streaming:
```javascript
sdk.startStreamingSpeechRecording(challenge, rec)
    .then(result => {
        console.log('Success!');
        })
    .catch(error => {
        console.log('Something went wrong!');
        })
```
It will continue to pull audio from the recorder until an event to stop has been fired. For more information see the examples.

**Warning** These examples are very simple and not detailed. See the examples for more information about event listening and audio handling.
