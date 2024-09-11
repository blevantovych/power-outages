import { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function App() {
  const [colors, setColors] = useState([]);
  useEffect(() => {
    fetch("http://localhost:3001")
      .then((res) => res.json())
      .then((colors) => {
        setColors(colors);
        console.log(colors);
      });
  }, []);
  return (
    <div className="App" style={{ display: "flex", flexDirection: "column" }}>
      {colors.map((row) => (
        <>
          <div style={{ display: "flex" }}>
            <Row colors={row} />
          </div>
        </>
      ))}
      <hr />
      {colors.map((row) => (
        <>
          <div style={{ display: "flex" }}>
            <IsOn colors={row} />
          </div>
        </>
      ))}
    </div>
  );
}

const IsOn = ({ colors }) => {
  return colors.map(({ from, to, power, rgba }, i) => {
    return (
      <div
        key={i}
        style={{
          width: "15px",
          height: "15px",
          backgroundColor: power ? "green" : "orange",
        }}
      ></div>
    );
  });
};

const Row = ({ colors }) => {
  return colors.map(({ from, to, power, rgba }, i) => {
    return (
      <div
        key={i}
        style={{
          width: "15px",
          height: "15px",
          backgroundColor: rgbToHex(...rgba.split(", ").map(Number)),
        }}
      ></div>
    );
  });
};

export default App;
