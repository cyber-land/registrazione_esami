import React, { useContext } from 'react'
import { Ctx } from './context.jsx'

const ExamsTable = (params) => {
  const { exams } = useContext(Ctx)
  if (!exams) return (<></>)
  return (
    <div className="overlow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th></th>
            <th>DATE</th>
            <th>TIME</th>
            <th>EXPORT</th>
          </tr>
        </thead>  
        <tbody>
          {exams.map((exam, pos) => <Exam key={pos} exam={exam} />)}
        </tbody>
      </table>
    </div>
  )
}

const Exam = (params) => {
  const { server_addr, token, sendErrorMessage } = useContext(Ctx)
  let exam = params.exam
  let i = 0
  return (
    <tr className="hover">
      <th>{/*{exam.id}*/}</th>
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
            else sendErrorMessage("impossible retrieve pdf data")
          }).then((body) => {
            console.log(body)
          }).catch(error => console.log(error))
        }}>
          <img src="https://img.icons8.com/ios/25/000000/download--v1.png"/>
        </a>
      </td>
    </tr>
  )
}

export default ExamsTable;
