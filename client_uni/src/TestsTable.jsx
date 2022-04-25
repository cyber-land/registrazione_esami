import React, { useContext, useState, useEffect } from 'react'
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
  if (!teoria_valida) teoria_valida = { id_prova: null }
  if (!programmazione_valida) programmazione_valida = { id_prova: null }
  if (!orale_valido) orale_valido = { id_prova: null }

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
          {tests.map((test, pos) => {
            const is_valid = (test.id_prova === teoria_valida.id_prova ||
              test.id_prova === programmazione_valida.id_prova || test.id_prova === orale_valido.id_prova);
            return <Test key={pos} test={test} pos={pos} is_valid={is_valid} />
          })}
        </tbody>
      </table>
    </>
  )
}

function Test(params) {
  const pos = params.pos
  const test = params.test
  const is_valid = params.is_valid

  const Modify = () => {

    //per l'ultima valutazione inserita, c'è un pulsante che apre un form per la modifica dei dati
    if (pos == 0) {
      const { setTests, server_addr, token, sendErrorMessage } = useContext(Ctx)
      const [valutazione, setValutazione] = useState(test.valutazione);
      const [tipologia, setTipologia] = useState(test.tipologia);
      const [stato, setStato] = useState(test.stato);
      const [note, setNote] = useState(test.note);

      return (
        <>
          <input type="checkbox" id="my-modal" className="modal-toggle" />
          <div className="modal">
            <div className="modal-box">
              <form className="flex justify-center px-4 py-16 bg-base-100 card-body" style={{ gap: "10px" }}>
                <input className="input input-bordered input-primary bg-base-100 w-full max-w-xs" type="number" placeholder="valutazione"
                  value={valutazione} onChange={e => { setValutazione(e.target.value) }} ></input>

                <select className="select select-bordered select-secondary w-full max-w-xs" value={tipologia} onChange={e => { setTipologia(e.target.value) }} >
                  <option>teoria</option>
                  <option>programmazione</option>
                  <option>orale</option>
                </select>
                <select className="select select-bordered select-secondary w-full max-w-xs" value={stato} onChange={e => { setStato(e.target.value) }} >
                  <option>accettato</option>
                  <option>ritirato</option>
                  <option>rifiutato</option>
                </select>
                <input className="input input-bordered input-primary bg-base-100 w-full max-w-xs" type="text" placeholder="note"
                  value={note} onChange={e => { setNote(e.target.value) }} ></input>
              </form>
              <div className="modal-action">
                <label htmlFor="my-modal" className="btn" onClick={e => {
                  //e.preventDefault()
                  if (!valutazione || !tipologia || !stato) {
                    sendErrorMessage("invalid fields")
                  } else {
                    fetch(`${server_addr}/tests/${test.id_prova}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        valutazione: valutazione,
                        tipologia: tipologia,
                        stato: stato,
                        note: note,
                      })
                    }).then((res) => {
                      if (res.ok) { return res.json(); }
                      else sendErrorMessage("invalid fields")
                    }).then(() => {
                      setTests([])
                    })
                  }
                }}>create </label>
              </div>
            </div>
          </div>

          <label htmlFor="my-modal" className="btn modal-button">open modal</label>
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
