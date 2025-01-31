/* 
CREATE TABLE todo (id INTEGER, todo TEXT, priority TEXT, status TEXT)
INSERT INTO todo (id, todo, priority, status) 
   VALUES (1,"Learn HTML", "HIGH", "TO DO"),
   (2, "Learn JS", "MEDIUM", "DONE"),
   (3, "Learn CSS", "LOW", "DONE"),
   (4, "PLay CHESS", "LOW", "DONE");
   SELECT * FROM todo ;
*/

const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

const databasePath = path.join(__dirname, 'todoApplication.db')
let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server is Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`ERROR: ${error.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodoQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
        SELECT 
          * 
        FROM 
          todo
        WHERE todo LIKE '%${search_q}%' 
        AND status = '${status}' 
        AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodoQuery = `
        SELECT 
          * 
        FROM 
          todo
        WHERE todo LIKE '%${search_q}%'  
        AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodoQuery = `
        SELECT 
          * 
        FROM 
          todo
        WHERE todo LIKE '%${search_q}%'  
        AND status = '${status}';`
      break

    default:
      getTodoQuery = `
      SELECT 
          * 
        FROM 
          todo
        WHERE todo LIKE '%${search_q}%';`
  }
  data = await database.all(getTodoQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
    SELECT 
      *
    FROM
      todo
    WHERE
      id = ${todoId};`

  const todo = await database.get(getTodoQuery)
  response.send(todo)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postTodoQuery = `
    INSERT INTO
      todo (id, todo, priority, status)
    VALUES
      (${id},'${todo}','${priority}','${status}');`
  await database.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updatedColumn = ''
  const requestBody = request.body
  switch (true) {
    case 'status' in requestBody:
      updatedColumn = 'Status'
      break
    case 'priority' in requestBody:
      updatedColumn = 'Priority'
      break
    case 'todo' in requestBody:
      updatedColumn = 'Todo'
      break
  }

  const previousTodoQuery = `
    SELECT 
      *
    FROM 
      todo
    WHERE
      id = ${todoId};`
  const previousTodo = await database.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  const updateTodoQuery = `
    UPDATE 
      todo
    SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}'
    WHERE
      id = ${todoId};`

  await database.run(updateTodoQuery)
  response.send(`${updatedColumn} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE 
    id = ${todoId};`
  await database.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
