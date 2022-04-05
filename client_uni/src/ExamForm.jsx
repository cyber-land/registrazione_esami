import { useContext, useEffect, useState } from 'react';
import { Ctx } from './context.jsx'

const ExamForm = (params) => {
  const { retrieveExams, server_addr, token, sendErrorMessage } = useContext(Ctx)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  return (
    <>
      <br></br>
      <form uk-grid="true">
        <div className="uk-width-1-3">
          <input className="uk-input" type="date" placeholder="date"
            value={date} onChange={e => { setDate(e.target.value) }} ></input>
        </div>
        <div className="uk-width-1-3">
          <input className="uk-input" type="time" placeholder="date"
            value={time} onChange={e => { setTime(e.target.value) }} ></input>
        </div>
        <div className="uk-width-1-6">
          <button className="uk-button uk-button-default" onClick={e => {
            //TODO: generare errore in caso la data sia già presente nel db
            //TODO: implementare l'inserimento dell'ora, lato server
            e.preventDefault()
            fetch(`${server_addr}/exams`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                data: date,
                time: time
              })
            }).then((res) => {
              if (res.ok) { return res.json(); }
              else sendErrorMessage(res.status)
            }).then(body => {
              retrieveExams()
            }).catch(error => console.log(error))
            setDate("")
          }}>send</button>
        </div>
        <div className="uk-width-1-6">
          <button className="uk-button uk-button-default" onClick={e => {
            e.preventDefault()
            retrieveExams()
          }}>reload</button>
        </div>
      </form>
    </>
  )
}

export default ExamForm;
