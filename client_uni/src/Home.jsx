import { useContext } from 'react'
import { Ctx } from './context.jsx'

const ExamsList = (params) => {
  const { exams } = useContext(Ctx)
  if(exams) {
    const currentDate = new Date()
    const current_date = currentDate.toLocaleDateString("en-CA", {
                                                          year: "numeric",
                                                          month: "2-digit",
                                                          day: "2-digit"
                                                         })
    const todayExams = exams.filter(exam => exam.data.split(' ')[0] == current_date)
    if (todayExams.length != 0) {
      return (
        <ul>
          {todayExams.map((todayExam, pos) => <li key={pos}>Esame alle ore: {todayExam.data.split(' ')[1].substring(0, 5)}</li>)}
        </ul>
      )
    }
    else return (<p>Nessuna attività fissata per oggi! 🥳</p>)
  } else return (<></>)    
}

const Home = (params) => {
  const { parseJwt, token } = useContext(Ctx)
    return (
        <div className="hero min-h-screen">
            <div className="hero-content text-center">
              <div className="max-w-md">
                <h1 className="text-4xl font-bold">Buongiorno prof. {parseJwt(token).data.surname}</h1>
                <p className="py-6">Attività di oggi:</p>
                <ExamsList />
              </div>
            </div>
        </div>
    )
}

export default Home;