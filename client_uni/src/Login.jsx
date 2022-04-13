import { useContext, useEffect, useState } from 'react'
import { Ctx } from './context.jsx'

const Login = (params) => {
  const { server_addr, setToken, sendErrorMessage } = useContext(Ctx)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  return (
    <>
      <section style={{display: "flex", margin: "12%", justifyContent: "center", alignItems: "center"}}>
        <div className="mockup-window border bg-secondary card w-96 shadow-xl">
          <form className="flex justify-center px-4 py-16 bg-base-100 card-body">
            <div>
              <input className="input input-bordered input-primary bg-base-100 w-full max-w-xs" type="text" placeholder="username"
                value={username} onChange={e => { setUsername(e.target.value) }} ></input>
            </div>
            <div>
              <input className="input input-bordered input-secondary bg-base-100 w-full max-w-xs" type="password" placeholder="password"
                value={password} onChange={e => { setPassword(e.target.value) }} ></input>
            </div>
            <div className="card-actions justify-end">
              <button className="btn btn-accent" onClick={e => {
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
                  else sendErrorMessage("wrong credentials")
                }).then(body => {
                  if (body) {
                    setToken(body.jwt)
                  }
                  //setUsername("")
                  //setPassword("")
                }).catch(error => console.log('error:', error))
              }}>send</button>
            </div>
          </form>
        </div>
      </section>  
    </>
  )
}

export default Login;
