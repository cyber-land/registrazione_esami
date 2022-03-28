import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'
import { BrowserRouter, Routes, Route, Link, Router } from "react-router-dom"
import Hero from './hero.jsx'
import Navbar from './navbar.jsx'
import ExamForm from './ExamForm.jsx'
import ExamsTable from './ExamsTable.jsx'
import Login from './Login.jsx'
import { Ctx } from './context.jsx'
//import server_addr from './config'

const Main = () => {
  const [identificationNumber, setIdentificationNumber] = useState("")  // matricola
  const [student, setStudent] = useState([])  // dati dello studente
  const [tests, setTests] = useState([])      // lista dei test riferiti allo studente
  const [courses, setCourses] = useState([])  // lista di tutti i corsi
  const [exams, setExams] = useState([])      // lista di tutti gli esami
  const server_addr = "http://localhost:8080/server_uni"

  function retrieveExams() {
    fetch(`${server_addr}/exams`).then(r => r.json()).then(body => setExams(body))
  }

  function retrieveCourses() {
    fetch(`${server_addr}/courses`).then(r => r.json()).then(body => setCourses(body))
  }

  function retrieveStudent() {
    const str = identificationNumber.replace('/\s/g', '') //matricola senza spazi
    if (str) {
      fetch(`${server_addr}/students/${str}`)
        .then(r => r.json()).then(body => setStudent(body))
    }
  }

  function retrieveTestsOfStudent(student_id) {
    fetch(`${server_addr}/students/${student_id}/tests`)
      .then(r => r.json()).then(body => setTests(body))
  }

  //durante il primo render, vengono recuperati la lista dei corsi e degli esami
  useEffect(() => { retrieveCourses(); retrieveExams() }, [])

  //quando la matricola cambia viene chiesto al server se esiste uno studente che abbia quella matricola
  //TODO: vengono fatte tante fetch, forse è meglio usare un pulsante
  useEffect(() => { retrieveStudent() }, [identificationNumber])

  //se si strova una corrisponedenza nel db, vengono recuperati i test che riguardano quella matricola
  //TODO: risparmiare sulle fetch, utilizzando una migliore sincronizzazione delle azioni
  useEffect(() => { if (student.length) retrieveTestsOfStudent(student[0].id) }, [student])

  //utilizzo del context per condividere alcune variabili e funzioni con gli altri componenti
  //TODO: se non ha fatto il login, bisogna redirigere tutto sul login (forse è da fare lato server)
  return (
    <>
      <Ctx.Provider value={{
        identificationNumber, setIdentificationNumber,
        courses, setCourses,
        tests, setTests,
        student, retrieveStudent,
        exams, retrieveExams, 
        server_addr
      }}>
        <BrowserRouter>
          <Routes>
            <Route path="/exams" element={
              <>
                <ExamForm />
                <ExamsTable />
              </>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={
              <>
                <Navbar />
                <Hero student={student} />
              </>
            } />
          </Routes>
        </BrowserRouter>
      </Ctx.Provider>
    </>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
  document.getElementById('root')
)
