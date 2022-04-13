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
import Home from './Home.jsx';
import { Ctx } from './context.jsx'
import './index.css'
// import { themeChange } from 'theme-change';

const Main = () => {

  //IDEA: change theme
  /*
  useEffect(() => {
    themeChange(false)
  }, [])
  */

  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  }
  const [search_value, set_search_value] = useState("")  // valore che viene ricercato (matricola/cognome)
  const [student, setStudent] = useState("")  // dati dello studente
  const [tests, setTests] = useState([])      // lista dei ùtest riferiti allo studente
  const [courses, setCourses] = useState([])  // lista di tutti i corsi
  const [exams, setExams] = useState([])      // lista di tutti gli esami
  const [token, setToken] = useState(JSON.parse(localStorage.getItem("jwt"))) // JWT (json web token)
  const server_addr = "http://localhost/RegistrazioneEsami/registrazione_esami/server_uni"
  // const server_addr = "http://localhost:8080/server_uni"

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
    const str = search_value.replace('/\s/g', '') //rimozione degli spazi bianchi
    if (str) {
      fetch(`${server_addr}/students/${str}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then((res) => {
        if (res.ok) { return res.json(); }
        else sendErrorMessage(res.status)
      }).then(body => {
        setStudent(body[0])
      })
    } else {
      setStudent("")
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

  // TODO: sessiontimeout.js chiudere la sessione dopo tot tempo di inattività
  // WARNING: può dare problemi durante gli hot-update
  useEffect(() => {
    localStorage.setItem("jwt", JSON.stringify(token))
    if (token) {
      const jwtparsed = parseJwt(token)
      //rigenerazione automatica del token quando la sua vita supera la metà
      const timer = setTimeout(() => {
        fetch(`${server_addr}/renew_token`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then((res) => {
          if (res.ok) { return res.json(); }
          else sendErrorMessage("impossible renew the token")
        }).then(body => { if (body) setToken(body.jwt) })
      }, (jwtparsed.exp - jwtparsed.iat)/2 * 1000);
      console.log(timer)
      retrieveCourses()
      retrieveExams()
      retrieveStudent()
      return () => clearTimeout(timer);
    }
  }, [token])
  
  //quando la matricola cambia viene chiesto al server se esiste uno studente che abbia quella matricola
  //TODO: limitare il numero di chiamate utilizzando un timer
  useEffect(() => { retrieveStudent() }, [search_value])

  //se si trova una corrisponedenza nel db, vengono recuperati i test che riguardano lo studente
  useEffect(() => { if (student) retrieveTestsOfStudent(student.id) }, [student])

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
    //TODO: migliorare lo switching (usare i modal od una pagina separata per la creazione dello studente)
    if (student) {
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
  //se non ha un token (valido), redirigere tutto sul login
  //TODO: separare in tanti context, ognuno per ogni area di influenza
  //TODO: eliminare il routing, utilizzando al suo posto i modal
  return (
    <>
      <Ctx.Provider value={{
        search_value/*navbar*/, set_search_value/*navbar*/,
        courses/*studentform*/, 
        tests/*testtable*/, setTests/*testform*/,
        student/*testform, studentform*/, retrieveStudent/*StudentForm*/, 
        exams/*testform, examstable*/, retrieveExams/*ExamForm*/,
        token, setToken/*login, navbar*/,
        server_addr,
        sendErrorMessage,
        parseJwt/*testform*/
      }}>
        <BrowserRouter>
          {token ? <>
            <Navbar />
            <Routes>
              <Route path="*" element={
                  <Home />
              }>
              </Route>
              <Route path="/exams" element={
                <>
                  <ExamForm />
                  <ExamsTable />
                </>
              } />
              <Route path="/addstudent" element={
                // <Hero student={student} />
                <StudentForm />
              } />
            </Routes>
          </> : <Login />}
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

/* IDEAS:
* (❌ searchbar) (✅ search icon → click → apre modal con searchbar) e (⚠️ dati studente)
* 
*/