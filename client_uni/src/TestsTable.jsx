import React, { useContext } from 'react'
import { Ctx } from './context.jsx'

const TestsTable = (params) => {
  const { tests } = useContext(Ctx)
  if (!tests) return (<></>)
  return (
    <>
      <table className="uk-table uk-table-divider">
        <thead>
          <tr>
            <th>valutazione</th>
            <th>tipologia</th>
            <th>stato</th>
            <th>note</th>
            <th>data esame</th>
            <th>modify</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test, pos) => <Test key={pos} test={test} pos={pos} />)}
        </tbody>
      </table>
    </>
  )
}

function Test(params) {
  const pos = params.pos
  const test = params.test
  
  const Modify = () => {
  //TODO: quando preme il bottone viene aperto un modal che contiene un form per la modifica della prova 
    if (pos == 0) {
      return (
        <>
          <button>modify</button>
        </>
      )
    } else return (<>-</>)
  }

  return (
    <tr>
      <td>{test.valutazione}</td>
      <td>{test.tipologia}</td>
      <td>{test.stato}</td>
      <td>{params.test.note ? params.test.note : '-'}</td>
      <td>{test.data.split(" ")[0]}</td>{/*toglie l'orario, mostrando solo la data*/}
      <td><Modify /></td>
    </tr>
  )
}

export default TestsTable; 
