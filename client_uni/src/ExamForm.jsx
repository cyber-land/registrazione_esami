import { useContext, useEffect, useState } from 'react';
import { Ctx } from './context.jsx'

const ExamForm = (params) => {
  const { retrieveExams, server_addr, token, sendErrorMessage } = useContext(Ctx)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  return (
    <>
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
        <label htmlFor="my-modal-4" className="btn btn-circle btn-accent btn-lg modal-button" style={{ position: "absolute", marginTop: "40px", marginRight: "40px" }}>
          <img src="../assets/icons/plus_24.png" width={"50%"} />
        </label>
      </div>
      <input type="checkbox" id="my-modal-4" className="modal-toggle" />
      <label htmlFor="my-modal-4" className="modal cursor-pointer" style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", flexWrap: "wrap" }}>
        <label className="modal-box relative mockup-window border bg-secondary card w-96 shadow-xl" style={{ padding: "24px 0 0 0" }} htmlFor="">
          <form className="flex justify-center px-4 py-16 bg-base-100 card-body" style={{ gap: "10px" }}>
            <input type="date" className="input input-bordered input-primary bg-base-100 w-full max-w-xs" value={date} onChange={e => { setDate(e.target.value) }} />
            <input type="time" className="input input-bordered input-secondary bg-base-100 w-full max-w-xs" value={time} onChange={e => { setTime(e.target.value) }} />
            <div className="card-actions justify-end">
              <button className="btn btn-accent" onClick={e => {
                e.preventDefault()
                if (!date) {
                  sendErrorMessage("invalid fields")
                } else {
                  let data = date
                  if (time)
                    data += ' ' + time
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
              }}>Add</button>
            </div>
          </form>
        </label>
      </label>
    </>
  )
}

export default ExamForm;
