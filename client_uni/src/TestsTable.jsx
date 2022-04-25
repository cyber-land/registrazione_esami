import React, { useContext } from 'react'
import { Ctx } from './context.jsx'

const TestsTable = () => {
  const { tests } = useContext(Ctx)
  if (!tests) return (<></>)
  let teoria_valida = tests.find(test => 
    (test.stato === 'accettato' && test.valutazione >= 8 && test.tipologia === 'teoria')
  )
  let programmazione_valida = tests.find(test => 
    (test.stato === 'accettato' && test.valutazione >= 8 && test.tipologia === 'programmazione')
  )
  let orale_valido = tests.find(test => (test.tipologia === 'orale'))
  if (!teoria_valida) teoria_valida={id_prova: null}
  if (!programmazione_valida) programmazione_valida={id_prova: null}
  if (!orale_valido) orale_valido={id_prova: null}
  return (
    <div className="overlow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>VALUTAZIONE</th>
            <th>TIPOLOGIA</th>
            <th>STATO</th>
            <th>NOTE</th>
            <th>DATA ESAME</th>
            <th>MODIFICA</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test, pos) => {
            const is_valid = (test.id_prova === teoria_valida.id_prova ||
              test.id_prova === programmazione_valida.id_prova || test.id_prova === orale_valido.id_prova);
            return <Test key={pos} test={test} pos={pos} is_valid={is_valid} />
          })}
        </tbody>
      </table>
    </div>
  )
}

function Test(params) {
  const pos = params.pos
  const test = params.test
  const is_valid = params.is_valid

  const Modify = () => {
    //TODO: quando preme il bottone viene aperto un modal che contiene un form per la modifica della prova 
    if (pos == 0) {
      return (
        <>
          <button onClick={() => {
            //aprire un modal
          }}>modify</button>
        </>
      )
    } else return (<>-</>)
  }
  if (is_valid) { //disegnare in verde
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
  } else { //disegnare in rosso
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
}

export default TestsTable; 
