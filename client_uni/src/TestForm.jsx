import React, { useState, useEffect, useContext } from 'react'
import { Ctx } from './context.jsx'

const TestForm = () => {
  const { student, retrieveStudent, exams, server_addr, token, sendErrorMessage, ref_token_parsed, courses } = useContext(Ctx)
  const [valutazione, setValutazione] = useState("");
  const [tipologia, setTipologia] = useState("teoria");
  const [stato, setStato] = useState("accettato");
  const [note, setNote] = useState("");
  const [esame, setEsame] = useState("");
  const voto_studente = (student && student.voto) ? student.voto + "/30" : "<void>"
  useEffect(() => { if (exams && exams[0]) setEsame(exams[0].id) }, [exams])
  
  if (!exams || !student) return (
    <div style={{display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", height: "300px"}}>
      <h1 className="text-3xl">nessuno studente corrisponde ai criteri di ricerca</h1>
    </div>
  )
  
  const ModificaStudente = () => {
    const [nome, setNome] = useState(student.nome)
    const [cognome, setCognome] = useState(student.cognome)
    const [voto, setVoto] = useState(student.voto ? student.voto : "")
    const [corso, setCorso] = useState(student.corso)
    return (
      <>
        <input type="checkbox" id="my-modal2" className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <form className="flex justify-center px-4 py-16 bg-base-100 card-body" style={{ gap: "10px" }}>
              <input type="text" placeholder="cognome" className="input input-bordered input-secondary bg-base-100 w-full max-w-xs"
                value={cognome} onChange={e => { setCognome(e.target.value) }} />
              <input type="text" placeholder="nome" className="input input-bordered input-primary w-full max-w-xs"
                value={nome} onChange={e => { setNome(e.target.value) }} />
              <select className="select select-bordered select-secondary w-full max-w-xs" value={corso} onChange={e => { setCorso(e.target.value) }}>
                {courses.map((course, pos) => <option key={pos}> {course.descrizione} </option>)}
              </select>
              <input type="number" placeholder="voto" className="input input-bordered input-primary bg-base-100 w-full max-w-xs"
                value={voto} onChange={e => { setVoto(e.target.value) }} />
            </form>
            <div className="modal-action">
              <label htmlFor="my-modal2" className="btn" onClick={e => {
                //e.preventDefault()
                if (!nome || !cognome || !corso) {
                  sendErrorMessage("invalid fields")
                } else if (nome === student.nome && cognome === student.cognome && voto === student.voto 
                  && corso === student.corso) {
                  sendErrorMessage("nothing change")
                }else {
                  fetch(`${server_addr}/students/${student.id}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      nome: nome,
                      cognome: cognome,
                      voto: voto,
                      corso: corso
                    })
                  }).then((res) => {
                    if (res.ok) { return res.json(); }
                    else sendErrorMessage("error")
                  }).then( () => {
                    retrieveStudent()
                  }).catch(error => console.log(error))
                }
              }}>Crea </label>
            </div>
          </div>
        </div>

        <label htmlFor="my-modal2" className="btn modal-button">update</label>
      </>
    )
  }

  return (
    <>
      <br></br>
      <div className="overlow-x-auto" style={{overflowX: "auto"}}>
        <table className="table w-full">
          <thead>
            <tr>
              <th>MATRICOLA</th>
              <th>COGNOME</th>
              <th>NOME</th>
              <th>CORSO</th>
              <th>VOTO</th>
              <th>MODIFICA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{student.matricola}</td>
              <td>{student.cognome}</td>
              <td>{student.nome}</td>
              <td>{student.corso}</td>
              <td>{voto_studente}</td>
              <td><ModificaStudente /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <br></br>
      <form className="bg-base-100" style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
        <input className="input w-full max-w-xs" type="number" placeholder="valutazione" value={valutazione} onChange={e => { setValutazione(e.target.value) }} ></input>
        <select className="select w-full max-w-xs" value={tipologia} onChange={e => { setTipologia(e.target.value) }} >
          <option>teoria</option>
          <option>programmazione</option>
          <option>orale</option>
        </select>
        <select className="select w-full max-w-xs" value={stato} onChange={e => { setStato(e.target.value) }} >
          <option>accettato</option>
          <option>ritirato</option>
          <option>rifiutato</option>
        </select>
        <input className="input w-full max-w-xs" type="text" placeholder="note" value={note} onChange={e => { setNote(e.target.value) }} ></input>
        <select className="select w-full max-w-xs" value={esame} onChange={e => { setEsame(e.target.value) }} >
          {exams.map((exam, pos) => <option key={pos} value={exam.id}> {exam.data.split(" ")[0]} </option>)}
        </select>
        <button className="btn" onClick={e => {
          e.preventDefault()
          //console.log(valutazione, tipologia, stato, esame)
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
              if (res.ok) { res.json().then(() => {retrieveStudent()} )}
              //se ritorna 'precondition request' mostra l'errore all'utente
              if (res.status == 428) {res.json().then(data => sendErrorMessage(data['error']))}
              //stampa il risultato di errore (forse nell'altro then)
            })
          }
        }}>create</button>
      </form>
      <br></br>
    </>
  );
}

export default TestForm;
