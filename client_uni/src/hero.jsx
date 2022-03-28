import StudentForm from './StudentForm.jsx'
import TestForm from './TestForm.jsx'
import TestsTable from './TestsTable.jsx'

const Hero = (params) => {
  const student = params.student
  /* se viene trovata una corrispondenza (tra la matricola inserita e quelle nel db)
  mostra un form per aggiungere un nuovo voto e sotto la lista di tutti i voti che lo studente ha preso
  altrimenti mostra un form per la creazione dello studente */
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

export default Hero;
