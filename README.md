# ITSLanguage JavaScript SDK Examples

Welcome to the ITSLanguage Example project. This project contains examples for
the [ITSLanguage JavaScript SDK](https://www.npmjs.com/package/itslanguage).
You can use these examples as a reference guide to how you will use the SDK in your own website.

## Getting Started

You can view the code in the files contained in this project, or run the project in a local server
and interact with the examples. These instructions will get the project up and running on your local machine.

### Installation

Navigate to wherever you have stored the project.

````
$ cd examples
````

Install all required packages using [npm](https://www.npmjs.com/)

````
$ npm install
````

Run the project

````
$ npm start
````

By default, the project will be accessible on localhost:3000. This can be changed in package.json by modifying the line 
````
"start": "webpack-dev-server --hot --inline --progress --color --port 3000"
````
and changing the port flag.

## API Reference

The examples contained in this project detail every use case that is possible with the ITSLanguage SDK. Most are very simple, such as
creating and pulling data to and from a server. Other use cases, such as streaming, require more in depth interaction with a frontend
page, such as creating an audio recorder on an HTML page.
As such, we have supplied a simple interpretation of how this could be used. You are free to copy this.
Should you want to create your own implementation see the section about Streaming.

The SDK uses [ES6](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)
and [WhenJS Promises](https://github.com/cujojs/when) to deliver information and any error messages to you.
See their documentation for more information.

Some common use cases are available below.

## Examples

### Connection

#### REST
In order to use the ITSLanguage SDK you will need to connect to both the REST server and the
websocket server using a `Connection` object.

To create a `Connection` object, you will need to submit the URL of the REST API, the URL of the websocket server,
a login name and password in a JSON object:
````
information = {
    apiUrl: <RESTurl>,
    authPrincipal: <username>,
    authCredentials: <password>,
    wsUrl: <websocketUrl>
}
````
You will then need to create a `Connection` object with this data as parameter.
````
its = require('itslanguage');
connection = new its.Connection(information);
````

#### Websocket

To connect to the websocket server you will need to request a token from our server.
This token can be requested per tenant that needs one. Be sure a tenant exists and has been created in our database.
Then you need to create a `BasicAuth` object. This fills in server generated credentials to request a token with.
````
tenant = new its.Tenant('1', 'John');
basicAuth = new its.BasicAuth(tenant.name);
basicAuthController = new its.BasicAuthController(connection);
basicAuthController.createBasicAuth(basicAuth)
    .then(result => {
        basicAuth = result;
    });
````

Then it's a simple matter of requesting a token and using it to connect to the websocket server.
````
connection.getOauth2Token(basicAuth)
    .then(result => {
        connection.webSocketConnect(result.access_token);
    });
````
For information on how to listen if the connection was successful or not, see the examples in the project.

### REST Examples

All of the REST use cases are quite simple. The workflow goes like this:
1. Create the object that you need processed.
2. Create the corresponding controller of the object.
3. Use the controller.
4. React to the results.

To create a new Student in our database:
````
student = new its.Student(<parameters>);
studentController = new its.StudentController(connection);
studentController.createStudent(student)
    .then(result => {console.log('Success! Got ' + result));
    .catch(error => {console.log('Encountered error ' + error + '!'));
````
A successful result will in this case return the object you submitted with the new properties `created` and `updated`.
Sometimes an id can also be generated.
A rejected result is an object with either a `message` string or an `errors` object with detailed errors.
For more information see the examples in the project.

## Streaming

To stream audio, an HTML component along with backing JavaScript will need to be registered with the SDK. It may be difficult for
you to create, so we have supplied our own implementation free for use.
Nevertheless, to register a component with the SDK:
````
itsRecorder = new its.AudioRecorder({forceWave: true});   //Internal representation of an audio recorder.
GUIrecorder = document.getElementById('recorder');        //Div of the custom HTML element representing a recorder.
recorderUI = new uicomps.Recorder({
  element: GUIrecorder,
  recorder: itsRecorder,
  maxRecordingDuration: 200
});
````
An audio player can also be registered together with the Recorder.
````
recorderUI.player = new its.AudioPlayer();
````
A volume meter can also be bound to the recorder. See the examples.

To start streaming audio for recording, recognition or analysis you will need to create a `Challenge` to accompany
the incoming recording.
````
challenge = new its.SpeechChallenge('fb');
challenge.topic = 'ExamQuestion4';
challengeController = new its.SpeechChallengeController(connection);
challengeController.createSpeechChallenge(challenge)
    .then(result => {
        challenge = result;
        })
    .catch(error => {
        console.log(error.message);
        });
````
And then start streaming:
````
challengeController.startStreamingSpeechRecording(challenge, rec)
    .then(result => {
        console.log('Success!);
        })
    .catch(error => {
        console.log('Something went wrong!');
        })
````
It will continue to pull audio from the recorder until an event to stop has been fired. For more information see the examples.