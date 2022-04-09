import React, { useState, useEffect, useContext } from 'react'
import { Ctx } from './context.jsx'

const TestForm = (params) => {
  const { student, setTests, exams, server_addr, token, sendErrorMessage, parseJwt } = useContext(Ctx)
  const [valutazione, setValutazione] = useState("");
  const [tipologia, setTipologia] = useState("teoria");
  const [stato, setStato] = useState("accettato");
  const [note, setNote] = useState("");
  const [esame, setEsame] = useState("");
  const voto_studente = student.voto ? student.voto : "<void>"
  useEffect(() => { if (exams && exams[0]) setEsame(exams[0].id) }, [exams])
  if (!exams) return (<></>)
  return (
    <>
      <br></br>
      <h3 className="uk-child-width-1-6@s" uk-grid="true">
        <div className="uk-panel uk-text-break uk-text-center uk-text-uppercase">{student.matricola}</div>
        <div className="uk-panel uk-text-break uk-text-center uk-text-uppercase">{student.cognome}</div>
        <div className="uk-panel uk-text-break uk-text-center uk-text-uppercase">{student.nome}</div>
        <div className="uk-panel uk-text-break uk-text-center uk-text-uppercase">{student.corso}</div>
        <div className="uk-panel uk-text-break uk-text-center uk-text-uppercase">{voto_studente}/30</div>
        <button className="uk-button uk-button-default" onClick={e => { }} >modify</button>
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
            if (!valutazione || !tipologia || !stato || !esame) {
              sendErrorMessage("invalid fields")
            } else {
              fetch(`${server_addr}/tests`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  valutazione: valutazione,
                  tipologia: tipologia,
                  stato: stato,
                  note: note,
                  id_studente: student.id,
                  id_esame: esame,
                  id_professore: parseJwt(token).data.id,
                })
              }).then((res) => {
                if (res.ok) { return res.json(); }
                else sendErrorMessage("invalid fields")
              }).then(() => {
                setTests([])
              })
            }
          }}>create</button>
        </div>
      </form>
    </>
  );
}

export default TestForm;
