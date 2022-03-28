import React, { useState, useEffect, useContext } from 'react'
import { Ctx } from './context.jsx'

const TestForm = (params) => {
  const { student, setTests, exams, server_addr } = useContext(Ctx)
  const studente = student[0]
  //TODO: valori di defualt da rimpiazzare, siccome potrebbero essere sbagliati (default di select)
  const [valutazione, setValutazione] = useState("");
  const [tipologia, setTipologia] = useState("teoria");
  const [stato, setStato] = useState("accettato");
  const [note, setNote] = useState("");
  const [esame, setEsame] = useState("1");

  return (
    <>
      <br></br>
      <h3 className="uk-child-width-1-3@s" uk-grid="true">
        <div className="uk-panel uk-text-break uk-text-center uk-text-uppercase">{studente.cognome}</div>
        <div className="uk-panel uk-text-break uk-text-center uk-text-uppercase">{studente.nome}</div>
        <div className="uk-panel uk-text-break uk-text-center uk-text-uppercase">{studente.corso}</div>
      </h3>
      <form uk-grid="true">
        <div className="uk-width-1-6">
          <input className="uk-input" type="number" placeholder="valutazione"
            value={valutazione} onChange={e => { setValutazione(e.target.value) }} ></input>
        </div>
        <div className="uk-width-1-6">
          <select className="uk-select" value={tipologia} onChange={e => { setTipologia(e.target.value) }} >
            <option>teoria</option>
            <option>programmazione</option>
            <option>orale</option>
          </select>
        </div>
        <div className="uk-width-1-6">
          <select className="uk-select" value={stato} onChange={e => { setStato(e.target.value) }} >
            <option>accettato</option>
            <option>ritirato</option>
            <option>rifiutato</option>
          </select>
        </div>
        <div className="uk-width-1-6">
          <input className="uk-input" type="text" placeholder="note"
            value={note} onChange={e => { setNote(e.target.value) }} ></input>
        </div>
        <div className="uk-width-1-6">
          <select className="uk-select" value={esame} onChange={e => { setEsame(e.target.value) }} >
            {exams.map((exam, pos) => <option key={pos} value={exam.id}> {exam.data.split(" ")[0]} </option>)}
          </select>
        </div>
        <div className="uk-width-1-6">
          <button className="uk-button uk-button-default" onClick={e => {
            e.preventDefault()
            fetch(`${server_addr}/tests`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                valutazione: valutazione,
                tipologia: tipologia,
                stato: stato,
                note: note,
                id_studente: studente.id,
                id_esame: esame,
                id_professore: 1,
              })
            }).then(r => r.json()).then(body => {
              setTests([])
              fetch(`${server_addr}/students/${studente.id}/tests`).then(r => r.json())
                .then(body => { body.map(test => { setTests(tests => [...tests, test]) }) })
            })
          }}>send</button>
        </div>
      </form>
    </>
  );
}

export default TestForm;
