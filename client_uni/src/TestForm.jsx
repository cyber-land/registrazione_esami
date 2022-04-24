import React, { useState, useEffect, useContext } from 'react'
import { Ctx } from './context.jsx'

const TestForm = () => {
  const { student, setTests, exams, server_addr, token, sendErrorMessage, ref_token_parsed, courses } = useContext(Ctx)
  const [valutazione, setValutazione] = useState("");
  const [tipologia, setTipologia] = useState("teoria");
  const [stato, setStato] = useState("accettato");
  const [note, setNote] = useState("");
  const [esame, setEsame] = useState("");
  const voto_studente = (student && student.voto) ? student.voto + "/30" : "<void>"
  useEffect(() => { if (exams && exams[0]) setEsame(exams[0].id) }, [exams])
  if (!exams || !student) return (<>nessuno studente corrisponde ai criteri di ricerca</>)

  const [matricola, setMatricola] = useState("")
  const [nome, setNome] = useState("")
  const [cognome, setCognome] = useState("")
  const [corso, setCorso] = useState("")
  

  return (
    <>
      <br></br>
      <h3 className="uk-child-width-1-6@s" uk-grid="true">

        <input type="checkbox" id="my-modal" class="modal-toggle" />
        <div class="modal">
          <div class="modal-box">

            <form className="flex justify-center px-4 py-16 bg-base-100 card-body" style={{ gap: "10px" }}>
              <input type="text" placeholder="matricola" className="input input-bordered input-primary bg-base-100 w-full max-w-xs"
                value={matricola} onChange={e => { setMatricola(e.target.value) }} />
              <input type="text" placeholder="cognome" className="input input-bordered input-secondary bg-base-100 w-full max-w-xs"
                value={cognome} onChange={e => { setCognome(e.target.value) }} />
              <input type="text" placeholder="nome" className="input input-bordered input-primary w-full max-w-xs"
                value={nome} onChange={e => { setNome(e.target.value) }} />
              <select className="select select-bordered select-secondary w-full max-w-xs" value={corso} onChange={e => { setCorso(e.target.value) }}>
                {courses.map((course, pos) => <option key={pos}> {course.descrizione} </option>)}
              </select>
              <div className="card-actions justify-end">

              </div>
            </form>
            <div class="modal-action">
              <label for="my-modal" class="btn" onClick={e => {
                e.preventDefault()
                if (!matricola || !nome || !cognome || !corso) {
                  sendErrorMessage("invalid fields")
                } else {
                  fetch(`${server_addr}/students/${student.id}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      matricola: matricola,
                      nome: nome,
                      cognome: cognome,
                      voto: null,
                      corso: corso
                    })
                  }).then((res) => {
                    if (res.ok) { return res.json(); }
                    else sendErrorMessage("conflict")
                  }).then(() => {
                    retrieveStudent()
                  }).catch(error => console.log(error))
                }
              }}>Crea </label>
            </div>
          </div>
        </div>

        <label for="my-modal" class="btn modal-button">open modal</label>
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
                  id_professore: ref_token_parsed.current.data.id,
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
