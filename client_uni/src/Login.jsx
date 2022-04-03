import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ctx } from './context.jsx'

const Login = (params) => {
  const { server_addr, token, setToken, sendErrorMessage } = useContext(Ctx)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

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
            e.preventDefault()
            fetch(`${server_addr}/auth`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                username: username,
                password: password
              })
            }).then((res) => {
              if (res.ok) { return res.json(); }
              else sendErrorMessage(res.status)
            }).then(body => {
              if (body) {
                setToken(body.jwt)
                //redirection to the mainpage
                navigate("/") //TODO: risolvere il warning (poi eliminare gli import non utilizzati)
              }
              setUsername("")
              setPassword("")
            }).catch(error => console.log('error:', error))
          }}>send</button>
        </div>
      </form>
    </>
  )
}

export default Login;
