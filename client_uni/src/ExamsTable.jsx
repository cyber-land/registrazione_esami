import React, { useContext } from 'react'
import { Ctx } from './context.jsx'

const ExamsTable = (params) => {
  const { exams, retrieveExams } = useContext(Ctx)
  if (!exams) return (<></>)
  return (
    <table className="uk-table uk-table-divider">
      <thead>
        <tr>
          <th>date</th>
          <th>time</th>
          <th>export</th>
        </tr>
      </thead>
      <tbody>
        {exams.map((exam, pos) => <Exam key={pos} exam={exam} />)}
      </tbody>
    </table>
  )
}

const Exam = (params) => {
  const { server_addr, token } = useContext(Ctx)
  let exam = params.exam
  return (
    <tr>
      <td>{exam.data.split(" ")[0]}</td>{/*toglie l'ora, mostrando solo la data*/}
      <td>{exam.data.split(" ")[1]}</td>{/*toglie la data, mostrando solo l'ora*/}
      <td>
        <a download="report.pdf" onClick={() => {
          fetch(`${server_addr}/exams/${exam.id}/pdf`, {
            method: "GET",
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).then((res) => {
            if (res.ok) { return res.json(); }
            else sendErrorMessage(res.status)
          }).then((body) => {
            console.log(body)
          }).catch(error => console.log(error))
        }}>
          <span uk-icon="push"></span>
        </a>
      </td>
    </tr>
  )
}

export default ExamsTable;
