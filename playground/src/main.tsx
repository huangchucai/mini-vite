import React from "react";
import ReactDOM from "react-dom";
// import App from "./App";
import "./index.css";

// ReactDOM.render(<App />, document.getElementById("root"));

const App = () => <div>hello 123123456</div>;

ReactDOM.render(<App />, document.getElementById("root"));

// @ts-ignore
import.meta.hot.accept(() => {
  ReactDOM.render(<App />, document.getElementById("root"));
});
