import { useContext, useEffect, useState } from 'react';
import { Ctx } from './context.jsx'

const ExamForm = (params) => {
  const { retrieveExams, server_addr, token, sendErrorMessage } = useContext(Ctx)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  return (
    <>
      <form className="footer p-10 text-base-context">
      <div className="footer-title"></div>
      <div className="footer-title">
          <input className="" type="date" placeholder="date"
            value={date} onChange={e => { setDate(e.target.value) }} ></input>
        </div>
        <div className="footer-title"></div>
        <div className="footer-title">
          <input className="" type="time" placeholder="date"
            value={time} onChange={e => { setTime(e.target.value) }} ></input>
        </div>
        <div className="footer-title"></div>
        <div className="footer-title">
          <button className="" onClick={e => {
            //TODO: generare errore in caso la data sia già presente nel db
            //TODO: implementare l'inserimento dell'ora, lato server
            e.preventDefault()
            if (!date) {
              sendErrorMessage("invalid fields")
            } else {
              let data = date
              if (time)
                data+=' '+time
              fetch(`${server_addr}/exams`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  data: data
                })
              }).then((res) => {
                if (res.ok) { return res.json(); }
                else sendErrorMessage("invalid fields")
              }).then(body => {
                retrieveExams()
              }).catch(error => console.log(error))
              setDate("")
            }
          }}>Send</button>
        </div>
      </form>
    </>
  )
}

export default ExamForm;
