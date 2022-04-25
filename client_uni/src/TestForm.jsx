import React, { useState, useEffect, useContext } from 'react'
import { Ctx } from './context.jsx'

const TestForm = () => {
  const { student, setTests, exams, server_addr, token, sendErrorMessage, ref_token_parsed } = useContext(Ctx)
  const [valutazione, setValutazione] = useState("");
  const [tipologia, setTipologia] = useState("teoria");
  const [stato, setStato] = useState("accettato");
  const [note, setNote] = useState("");
  const [esame, setEsame] = useState("");
  const voto_studente = (student && student.voto) ? student.voto + "/30" : "<void>"
  useEffect(() => { if (exams && exams[0]) setEsame(exams[0].id) }, [exams])
  if (!exams || !student) return (<>nessuno studente corrisponde ai criteri di ricerca</>)
  return (
    <>
      <br></br>
      {/* <h3 className="uk-child-width-1-6@s" uk-grid="true"> */}
        {/* <div className="uk-panel uk-text-break uk-text-center uk-text-uppercase">{student.matricola}</div> */}
        {/* <div className="uk-panel uk-text-break uk-text-center uk-text-uppercase">{student.cognome}</div> */}
        {/* <div className="uk-panel uk-text-break uk-text-center uk-text-uppercase">{student.nome}</div> */}
        {/* <div className="uk-panel uk-text-break uk-text-center uk-text-uppercase">{student.corso}</div> */}
        {/* <div className="uk-panel uk-text-break uk-text-center uk-text-uppercase">{voto_studente}</div> */}
        {/* <button className="uk-button uk-button-default" onClick={e => { }} >modify</button> */}
      {/* </h3> */}

      <div className="overlow-x-auto">
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
              <td><button className="uk-button uk-button-default" onClick={e => { }} >modify</button></td>
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
      </form>
      <br></br>
    </>
  );
}

export default TestForm;
