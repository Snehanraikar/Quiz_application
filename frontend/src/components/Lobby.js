import React, { useEffect, useState } from "react";

const Lobby = ({ socket, onRoomCreation }) => {
	const [name, setName] = useState("");
	const [roomName, setRoomName] = useState("");

	const createRoom = () => {
		if (!name || !roomName) {
			alert("Enter all fields");
			return;
		}
		socket.emit("create-room", { room: roomName, name });
		socket.on("room-entered", () => {
			onRoomCreation(roomName);
		});
		socket.on("room-error", (data) => {
			alert(data.message);
		});
	};

	const joinRoom = () => {
		if (!name || !roomName) {
			alert("Enter all fields");
			return;
		}
		socket.emit("join-room", { room: roomName, name });
		socket.on("room-entered", (data) => {
			onRoomCreation(roomName);
		});
		socket.on("room-error", (data) => {
			alert(data.message);
		});
	};

	useEffect(() => {
		return () => {
			socket.off("room-entered");
			socket.off("room-error");
		};
	}, [socket]);

	return (
		<div className="container">
			<div className="row justify-content-center mt-5">
				<div className="col-md-6">
					<div className="card shadow-sm">
						<div
							className="card-body "
							style={{ backgroundColor: "#e4e4e4" }}
						>
							<h4 className="card-title text-center">
								Create or Join Room
							</h4>
							<form>
								<div className="form-group">
									<label htmlFor="name">Name</label>
									<input
										type="text"
										className="form-control"
										id="name"
										placeholder="Enter your name"
										required={true}
										value={name}
										onChange={(e) =>
											setName(e.target.value)
										}
									/>
								</div>
								<div className="form-group">
									<label htmlFor="room-name">Room Name</label>
									<input
										type="text"
										className="form-control"
										id="room-name"
										placeholder="Enter room name"
										value={roomName}
										onChange={(e) =>
											setRoomName(e.target.value)
										}
									/>
								</div>
								<div className="row">
									<div className="col">
										<button
											type="button"
											className="btn btn-dark btn-block"
											onClick={createRoom}
										>
											Create Room
										</button>
									</div>
									<div className="col">
										<button
											type="button"
											className="btn btn-primary btn-block"
											onClick={joinRoom}
										>
											Join Room
										</button>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Lobby;
