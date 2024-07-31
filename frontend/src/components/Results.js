import React from "react";

const Results = ({ results }) => {
	return (
		<div className="container mt-5">
			<h1 className="text-center">
				{results.tie ? "It's a draw " : `Winner is ${results.winner} 🎉`}
			</h1>
			<table className="table table-hover mt-3">
				<thead className="thead-dark">
					<tr>
						<th scope="col">Name</th>
						<th scope="col">Score</th>
					</tr>
				</thead>
				<tbody>
					{Object.values(results.score).map((item, index) => (
						<tr key={index}>
							<td>{item.name}</td>
							<td>{item.score}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default Results;
