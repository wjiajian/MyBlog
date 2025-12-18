# The Future of React

React continues to evolve, pushing the boundaries of what's possible in web development.

## Server Components

Server Components allow developers to build apps that span the server and client. This combines the rich interactivity of client-side apps with the improved performance of traditional server rendering.

```javascript
// Server Component
import db from 'db';

async function Note({ id }) {
  const note = await db.notes.get(id);
  return (
    <div>
      <h2>{note.title}</h2>
      <section>{note.body}</section>
    </div>
  );
}
```

## The New Compiler

React Compiler (React Forget) is an automatic memoization compiler. It optimizes your React app automatically, so you don't have to manually use `useMemo` and `useCallback`.

> "It just works."

## Conclusion

The future looks bright for React developers.
