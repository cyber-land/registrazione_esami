import React, { useState, useEffect, useContext } from 'react'
import { Ctx } from './context.jsx'

const StudentForm = (params) => {
  const { courses, search_value, retrieveStudent, server_addr, token, sendErrorMessage } = useContext(Ctx)

  const [matricola, setMatricola] = useState("")
  const [nome, setNome] = useState("")
  const [cognome, setCognome] = useState("")
  const [corso, setCorso] = useState("")
  useEffect(() => { if (courses && courses[0]) setCorso(courses[0].descrizione) }, [courses])
  if (!courses) return (<></>)
  return (
    <>
      <form style={{display: "flex"}}>
        <input type="text" placeholder="matricola" className="input input-bordered w-full max-w-xs" 
          value={matricola} onChange={e => { setMatricola(e.target.value) }}/>

        <input type="text" placeholder="cognome" className="input input-bordered w-full max-w-xs"
          value={cognome} onChange={e => { setCognome(e.target.value) }} />

        <input type="text" placeholder="nome" className="input input-bordered w-full max-w-xs"
          value={nome} onChange={e => { setNome(e.target.value) }} />

        <select className="select select-bordered w-full max-w-xs" value={corso} onChange={e => { setCorso(e.target.value) }}>
            {courses.map((course, pos) => <option key={pos}> {course.descrizione} </option>)}  
        </select>
        <button className="btn btn-active btn-primary">crea</button>
      </form>









      <form className="footer p-10 text-base-context">
        <div className="footer-title">
          <input className="" type="text" placeholder="matricola"
            value={matricola} onChange={e => { setMatricola(e.target.value) }} ></input>
        </div>
        <div className="footer-title">
          <input className="" type="text" placeholder="cognome"
            value={cognome} onChange={e => { setCognome(e.target.value) }} ></input>
        </div>
        <div className="footer-title">
          <input className="" type="text" placeholder="nome"
            value={nome} onChange={e => { setNome(e.target.value) }} ></input>
        </div>
        <div className="footer-title">
          <select className="" value={corso} onChange={e => { setCorso(e.target.value) }} >
            {courses.map((course, pos) => <option key={pos}> {course.descrizione} </option>)}
          </select>
        </div>
        <div className="">
          <button className="" onClick={e => {
            //TODO: generare errore in caso la matricola sia già presente nel db
            //TODO: gestire se riceve una risposta che indica errore (controllare status code)
            e.preventDefault()
            if (!matricola || !nome || !cognome || !corso) {
              sendErrorMessage("invalid fields")
            } else {
              fetch(`${server_addr}/students`, {
                method: "POST",
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
              setMatricola("")
              setCognome("")
              setNome("")
            }
          }}>Create</button>
        </div>
      </form>
    </>
  );
}

export default StudentForm;
