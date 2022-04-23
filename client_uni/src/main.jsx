import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom'
import { BrowserRouter, Routes, Route, Link, Router } from "react-router-dom"
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
  const [student, setStudent] = useState()  // dati dello studente
  const [tests, setTests] = useState()      // lista dei test riferiti allo studente
  const [courses, setCourses] = useState()  // lista di tutti i corsi
  const [exams, setExams] = useState()      // lista di tutti gli esami
  const [token, setToken] = useState(JSON.parse(localStorage.getItem("jwt"))) // JWT (json web token)
  const [token_parsed, set_token_parsed] = useState()
  const [timer_search, set_timer_search] = useState()      // timer usato per limitare il numero di fetch eseguite
  const [timer_token, set_timer_token] = useState()
  const server_addr = "http://192.168.205.32:8080/server_uni"
  const ref_token_parsed = useRef()         // riferimento al token decodificato
  ref_token_parsed.current = token_parsed

  function retrieveExams() {
    fetch(`${server_addr}/exams`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then((res) => {
      if (res.ok) { return res.json(); }
      else sendErrorMessage(res.status)
    }).then(body => setExams(body)).catch(error => console.log('error:', error))
  }

  function retrieveCourses() {
    fetch(`${server_addr}/courses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then((res) => {
      if (res.ok) { return res.json(); }
      else sendErrorMessage(res.status)
    }).then(body => setCourses(body)).catch(error => console.log('error:', error))
  }

  //esegue una ricerca (dopo che l'utente ha smesso di digitare) in base al valore nella searchbar
  function retrieveStudent() {
    if (timer_search) {
      clearTimeout(timer_search)
      set_timer_search(null)
    }
    if (search_value) {
      set_timer_search(setTimeout(() => {
        fetch(`${server_addr}/students/search=${search_value}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then((res) => {
          if (res.ok) { return res.json(); }
          else sendErrorMessage(res.status)
        }).then(body => {
          if (body && body[0]) {
            setStudent(body[0].student)
            setTests(body[0].tests)
          } else {
            setStudent(null)
            setTests(null)
          }
        }).catch(error => console.log('error:', error))
      }, 600))
    } else {
      setStudent("")
      setTests("")
    }
  }

  //funzione chiamata quando si vuole mostrare un errore all'utente
  function sendErrorMessage(message) {
    console.log(message)
  }

  // TODO: sessiontimeout.js chiudere la sessione dopo tot tempo di inattività
  // WARNING: può capitare che durante gli hot-update non aggiorna il token con quello nuovo
  useEffect(() => {
    localStorage.setItem("jwt", JSON.stringify(token))
    set_token_parsed(parseJwt(token))
  }, [token])

  useEffect(() => {
    if (token_parsed) {
      const expirationTime = token_parsed.exp
      const currentTime = Math.round(Date.now() / 1000) //seconds since epoch
      if (currentTime < expirationTime) { //token valid
        if (timer_token) {
          clearTimeout(timer_token)
          //set_timer_token(null) //???
        }
        //rigenerazione automatica del token quando la sua vita supera la metà
        set_timer_token(setTimeout(() => {
          fetch(`${server_addr}/renew_token`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then((res) => {
            if (res.ok) { return res.json(); }
            else sendErrorMessage("impossible renew the token")
          }).then(body => {
            if (body) setToken(body.jwt)
          }).catch(error => console.log('error:', error))
        }, (token_parsed.exp - token_parsed.iat) / 2 * 1000));
        if (!courses) retrieveCourses()
        if (!exams) retrieveExams()
      } else { // token expired
        setToken("")
      }
    }
  }, [token_parsed])

  //quando la matricola cambia viene chiesto al server se esiste uno studente che abbia quella matricola
  useEffect(() => { retrieveStudent() }, [search_value])

  useEffect(() => {
    fetch(`${server_addr}/status`, {
    }).then((res) => {
      if (!res.ok) sendErrorMessage("the server is offline or misconfigurated")
    }).catch(() => sendErrorMessage("the server is offline or misconfigurated"))
  }, [])

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
        exams/*testform, examstable, home*/, retrieveExams/*ExamForm*/,
        token, setToken/*login, navbar*/,
        server_addr,
        sendErrorMessage,
        ref_token_parsed/*testform, home*/
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
                  <ExamsTable />
                  <ExamForm />
                </>
              } />
              <Route path="/addstudent" element={
                <StudentForm />
              } />
              <Route path="/search" element={
                <>
                <TestForm />
                <TestsTable />
                </>
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