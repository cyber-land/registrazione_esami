import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom'
import { BrowserRouter, Routes, Route, Link, Router, Navigate } from "react-router-dom"
import Navbar from './navbar.jsx'
import ExamForm from './ExamForm.jsx'
import ExamsTable from './ExamsTable.jsx'
import Login from './Login.jsx'
import StudentForm from './StudentForm.jsx'
import TestForm from './TestForm.jsx'
import TestsTable from './TestsTable.jsx'
import { Ctx } from './context.jsx'
//import server_addr from './config'

const Main = () => {
  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }
  const [identificationNumber, setIdentificationNumber] = useState("")  // matricola
  const [student, setStudent] = useState([])  // dati dello studente
  const [tests, setTests] = useState([])      // lista dei test riferiti allo studente
  const [courses, setCourses] = useState([])  // lista di tutti i corsi
  const [exams, setExams] = useState([])      // lista di tutti gli esami
  const [token, setToken] = useState(JSON.parse(localStorage.getItem("jwt"))) // JWT (json web token)
  const [userConnected, setUserConnected] = useState("") //Username dell'insegnante
  const server_addr = "http://localhost:8080/server_uni"

  const countRef = useRef(token);
  countRef.current = token

  // al primo avvio avvia un timer che controlla ogni 10 secondi 
  // se il token sta per scadere, nel caso, lo rinnova
  // TODO: generalizzare le quantità di tempo basandosi sul expDate del token ricevuto
  // WARNING: può dare problemi durante gli hot-update
  // TODO: sessiontimeout.js chiudere la sessione dopo tot tempo di inattività
  useEffect(() => {
    setInterval(() => {
      const jwt = countRef.current
      if (jwt) {
        const expirationTime = parseJwt(jwt).exp
        const currentTime = Math.round(Date.now() / 1000) //seconds since epoch
        if (currentTime > expirationTime) { // token expired
          setToken("")
        }
        if (currentTime > expirationTime-60) { // the token is about to expiring
          // chiama una rotta del server per farsi ritornare un nuovo token
          fetch(`${server_addr}/renew_token`, {
            headers: { 'Authorization': `Bearer ${jwt}` }
          }).then((res) => {
            if (res.ok) { return res.json(); }
            else sendErrorMessage("impossible renew the token")
          }).then(body => {if (body) setToken(body.jwt)})
        }
      }
    }, 10000);
  }, [])

  useEffect(() => {
    localStorage.setItem("jwt", JSON.stringify(token))
    if (token) {
      retrieveCourses()
      retrieveExams()
      retrieveStudent()
      setUserConnected(parseJwt(token).data.userName)
    } else {
      setUserConnected("")
    }
  }, [token])

  function retrieveExams() {
    fetch(`${server_addr}/exams`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then((res) => {
      if (res.ok) { return res.json(); }
      else sendErrorMessage(res.status)
    }).then(body => setExams(body))
  }

  function retrieveCourses() {
    fetch(`${server_addr}/courses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then((res) => {
      if (res.ok) { return res.json(); }
      else sendErrorMessage(res.status)
    }).then(body => setCourses(body))
  }

  function retrieveStudent() {
    const str = identificationNumber.replace('/\s/g', '') //matricola senza spazi
    if (str) {
      fetch(`${server_addr}/students/${str}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then((res) => {
        if (res.ok) { return res.json(); }
        else sendErrorMessage(res.status)
      }).then(body => { if (body) setStudent(body) })
    }
  }

  function retrieveTestsOfStudent(student_id) {
    fetch(`${server_addr}/students/${student_id}/tests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then((res) => {
      if (res.ok) { return res.json(); }
      else sendErrorMessage(res.status)
    }).then(body => setTests(body))
  }

  //quando la matricola cambia viene chiesto al server se esiste uno studente che abbia quella matricola
  useEffect(() => { retrieveStudent() }, [identificationNumber])

  //se si strova una corrisponedenza nel db, vengono recuperati i test che riguardano quella matricola
  useEffect(() => { if (student.length) retrieveTestsOfStudent(student[0].id) }, [student])

  //funzione chiamata quando si vuole mostrare un errore all'utente
  //TODO: limitare (con un timer) il numero di messaggi inviati
  function sendErrorMessage(message) {
    const msg = message
    UIkit.notification({
      message: msg,
      status: 'warning',
      pos: 'bottom-right'
    })
  }

  const Hero = () => {
    if (!token) return (<></>)
    /* se viene trovata una corrispondenza (tra la matricola inserita e quelle nel db)
    mostra un form per aggiungere un nuovo voto e sotto la lista di tutti i voti che lo studente ha preso
    altrimenti mostra un form per la creazione dello studente */
    //TODO: migliorare lo switching
    if (Array.isArray(student) && student.length) {
      return (
        <>
          <TestForm />
          <TestsTable />
        </>
      )
    } else {
      return (
        <>
          <StudentForm />
        </>
      )
    }
  }

  //utilizzo del context per condividere alcune variabili e funzioni con gli altri componenti
  //TODO: se non ha un token (valido), redirigere tutto sul login
  //TODO: separare in tanti context, ognuno per ogni area di influenza
  return (
    <>
      <Ctx.Provider value={{
        identificationNumber, setIdentificationNumber,
        courses, setCourses,
        tests, setTests,
        student, retrieveStudent,
        exams, retrieveExams,
        token, setToken,
        server_addr,
        retrieveTestsOfStudent,
        sendErrorMessage
      }}>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/exams" element={
              <>
                <ExamForm />
                <ExamsTable />
              </>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={
              <Hero student={student} />
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
