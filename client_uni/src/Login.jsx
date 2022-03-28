import { useContext, useEffect, useState } from 'react';
import { Ctx } from './context.jsx'

const Login = (params) => {
  const { server_addr } = useContext(Ctx)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  return (
    <>
      <br></br>
      <form uk-grid="true">
        <div className="uk-width-2-5">
          <input className="uk-input" type="text" placeholder="username"
            value={username} onChange={e => { setUsername(e.target.value) }} ></input>
        </div>
        <div className="uk-width-2-5">
          <input className="uk-input" type="password" placeholder="password"
            value={password} onChange={e => { setPassword(e.target.value) }} ></input>
        </div>
        <div className="uk-width-1-5">
          <button className="uk-button uk-button-default" onClick={e => {
            //TODO: generare errore in caso la data sia già presente nel db
            //TODO: implementare l'inserimento dell'ora, lato server
            e.preventDefault()
            fetch(`${server_addr}/login`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                username: username,
                password: password
              })
            }).then(r => {
              const status = r.status
              if (status === 401) { //not authorized
                console.log('response.status: ', status)
                UIkit.notification({ message: `status: ${status}`, status:'danger' })
              }
              r.json()
            }).then(body => {
              //TODO: verrà ritorato il JWT (json web token) che dovrà venire impostato globalmente
              setUsername("")
              setPassword("")
            }).catch(error => console.log(error))
            //TODO: se il login va a buon fine, si ridirige l'utente verso la mainpage
          }}>send</button>
        </div>
      </form>
    </>
  )
}

export default Login;
