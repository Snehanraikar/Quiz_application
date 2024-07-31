import React, { useState } from "react";
import Quiz from "./components/Quiz";
import Lobby from "./components/Lobby";
import './App.css';
import socketIOClient from "socket.io-client";

const socket = socketIOClient("http://localhost:5000", {
  withCredentials: true
});

function App() {
  const [roomCreated, setRoomCreated] = useState(false);
  const [roomName, setRoomName] = useState();

  const changeRoomCreated = (data) => {
    setRoomCreated(true);
    setRoomName(data);
  };

  return (
    <>
      {!roomCreated && (
        <Lobby socket={socket} onRoomCreation={changeRoomCreated} />
      )}
      {roomCreated && <Quiz room={roomName} socket={socket} />}
    </>
  );
}

export default App;
