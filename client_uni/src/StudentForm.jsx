import React, { useState, useEffect, useContext } from "react";
import { Ctx } from "./context.jsx";

const StudentForm = (params) => {
  const { courses, identificationNumber, retrieveStudent, server_addr } =
    useContext(Ctx);

  const [matricola, setMatricola] = useState(identificationNumber);
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [corso, setCorso] = useState("");

  useEffect(() => {
    setMatricola(identificationNumber);
  }, [identificationNumber]);
  useEffect(() => {
    if (courses[0]) setCorso(courses[0].descrizione);
  }, [courses]);

  return (
    <>
      <br></br>
      <form uk-grid="true">
        <div className="uk-width-1-5">
          <input
            className="uk-input"
            type="text"
            placeholder="matricola"
            value={matricola}
            onChange={(e) => {
              setMatricola(e.target.value);
            }}
          ></input>
        </div>
        <div className="uk-width-1-5">
          <input
            className="uk-input"
            type="text"
            placeholder="cognome"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
            }}
          ></input>
        </div>
        <div className="uk-width-1-5">
          <input
            className="uk-input"
            type="text"
            placeholder="nome"
            value={cognome}
            onChange={(e) => {
              setCognome(e.target.value);
            }}
          ></input>
        </div>
        <div className="uk-width-1-5">
          <select
            className="uk-select"
            value={corso}
            onChange={(e) => {
              setCorso(e.target.value);
            }}
          >
            {courses.map((course, pos) => (
              <option key={pos}> {course.descrizione} </option>
            ))}
          </select>
        </div>
        <div className="uk-width-1-5">
          <button
            className="uk-button uk-button-default"
            onClick={(e) => {
              //TODO: generare errore in caso la matricola sia già presente nel db
              //TODO: gestire se riceve una risposta che indica errore (controllare status code)
              e.preventDefault();
              let semaphore = true;
              fetch(`${server_addr}/students`, {
                method: "POST",
                body: JSON.stringify({
                  matricola: matricola,
                  nome: nome,
                  cognome: cognome,
                  voto: null,
                  corso: corso,
                }),
              })
                .then((r) => {
                  const status = r.status;
                  if (status != 200) {
                    console.log("response.status: ", status);
                    UIkit.notification({
                      message: `status: ${status}`,
                      status: "danger",
                    });
                    semaphore = false;
                  }
                  r.json();
                })
                .then((body) => {
                  //TODO: body is undefined?!?!
                  if (semaphore) {
                    UIkit.notification({
                      message: `created new student`,
                      pos: "top-right",
                    });
                    retrieveStudent();
                  }
                })
                .catch((error) => console.log(error));
              setMatricola("");
              setCognome("");
              setNome("");
              //setCorso("") //genera un errore se non viene ricaricato il form
            }}
          >
            send
          </button>
        </div>
      </form>
    </>
  );
};

export default StudentForm;
