import React, { useContext } from "react";
import { Ctx } from "./context.jsx";

const TestsTable = (params) => {
  const { tests } = useContext(Ctx);

  return (
    <>
      {/*<pre>{JSON.stringify(tests, null, 2)}</pre>*/}
      <table className="uk-table uk-table-divider">
        <thead>
          <tr>
            <th>valutazione</th>
            <th>tipologia</th>
            <th>stato</th>
            <th>note</th>
            <th>data esame</th>
            <th>edit</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test, pos) => (
            <Test key={pos} test={test} />
          ))}
        </tbody>
      </table>
    </>
  );
};

function Test(test) {
  test = test.test;
  let note = test.note;
  if (!note) note = "-";
  return (
    <tr>
      <td>{test.valutazione}</td>
      <td>{test.tipologia}</td>
      <td>{test.stato}</td>
      <td>{note}</td>
      <td>{test.data.split(" ")[0]}</td>
      {/*toglie l'orario, mostrando solo la data*/}
      <td>
        <span
          uk-icon="file-edit"
          uk-toggle="target: #toggle-animation; animation: uk-animation-fade"
        ></span>
        <div
          id="toggle-animation"
          className="uk-card uk-card-default uk-card-body uk-margin-small"
        >
          (Edit form)
        </div>
      </td>
    </tr>
  );
}

export default TestsTable;
