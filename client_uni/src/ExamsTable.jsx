import React, { useContext, useState, useRef, useEffect } from 'react'
import { Ctx } from './context.jsx'
import { jsPDF } from "jspdf"
import autoTable from 'jspdf-autotable'

const ExamsTable = (params) => {
  const { exams } = useContext(Ctx)
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
  const { server_addr, token, sendErrorMessage } = useContext(Ctx)
  const exam = params.exam
  const [pdf_data, set_pdf_data] = useState("")
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
            else sendErrorMessage("impossible retrieve pdf data")
          }).then((body) => {
            set_pdf_data(body)
          }).catch(error => console.log(error))
        }}>
          <button onClick={
            useEffect(() => {
              if (pdf_data) {
                const pdf = new jsPDF("portrait", "pt", "a4");
                pdf.text("esame del: " + exam.data.split(" ")[0]+" (id: "+exam.id+')', 40, 30); //inserire la data dell'esame
                autoTable(pdf, {
                  head: [['matricola', 'cognome', 'nome', 'teoria', 'programmazione', 'totale', 'note']],
                  body: pdf_data,
                })
                pdf.save("report.pdf");

              }
            }, [pdf_data])
          } type="button">
            Download
          </button>
        </a>
      </td>
    </tr>
  )
}

export default ExamsTable;
