# typed-payload
[![npm](https://img.shields.io/npm/v/typed-payload.svg?style=flat-square)](https://www.npmjs.com/package/typed-payload)
Library to provide strong typing for any form of event based payload.

## Motivation
In asynchronous programming, a common design pattern is to have a broker which passes messages from the producer to the consumer, which can be in the same process or in completely different machines. 
In a simple implementation, this message-passing goes through a multi-purpose channel (Even in complex implementations, it is often still a multi-purpose channel at the low-level view). 
It is common to create data types such as `{ event: <event>, payload: <actual message> }` to use the same channel for different events.
However, due to the channel being multi-purpose, it handles different events and hence difficult to manage typing information of the payload.
Discriminated union is the first class way to achieve easy typing but it has its limitations as well.

One common example is in the case of WebSockets. The following code is typical (ignoring serialization):

##### Common interface:
```ts
interface Payload1 {
  var1: string;
}
interface Message1 {
  event: "event 1";
  payload: Payload1;
}

interface Payload2 {
  var2: string;
}
interface Message2 {
  event: "event 2";
  payload: Payload2;
}

type Message = Message1 | Message2;
```

##### Producer
```ts
const payload1: Payload1 = {
  var1: "value",
};
ws.send({
  event: "event 1",
  payload: payload1,
}: Message1);

...

```

##### Consumer:
```ts
ws.on("message", (data: Message) => {
  if (data.event === "event 1") {
    // data is of type Message1
  }
  if (data.event === "event 2") {
    // data is of type Message2
  }

  ...
})
```

This is still manageable using discriminated unions. 
However, as the number of events grow, this code is not manageable and some would also want to make use of observer pattern so as to keep things more modular.
The subscibed function for that event would then need to do a discriminated check.

##### Consumer:
```ts
function subscribeToEvent(event: string, fn: (data: Message) => void) {
  eventSubscribers[event].push(fn);
}

ws.on("message", (data: Message) => {
  eventSubscribers[data.event].forEach(fn => fn(data));
});

// Usage anywhere else in the project
subscribeToEvent("event 1", data => {
  if (data.event === "event 1") { // redundant but necessary
    // data is of type Message1
  }
});
```

Even with discriminated union, some of the code can still be quite verbose just to comply with type safety.

## Solution with typed-payload

##### Common interface
```ts
interface Payload1 {
  var1: string
}
const event1 = TypedPayloadFactory.define<Payload1>("event 1")

interface Payload2 {
  var2: string
}
const event2 = TypedPayloadFactory.define<Payload2>("event 2")
```

##### Producer
```ts
const payload1: Payload1 = {
  var1: "value",
};
ws.send(event1.create(payload1));

...

```

##### Consumer:
```ts
ws.on("message", (data) => {
  if (event1.check(data)) {
    // data.payload is now of type Payload1
  }
  if (event2.check(data)) {
    // data.payload is now of type Payload2
  }

  ...
})
```

There is a slight reduction in verbosity and also better compile time check to reduce human errors.
However, where this library shines is by providing much better type safety over discriminated union in observer pattern.

##### Consumer:
```ts
function subscribeToEvent<T>(eventDef: PayloadTypeDef<T>, fn: (payload: T) => void) {
  eventSubscribers[event].push(fn);
}

ws.on("message", (data: Message) => {
  eventSubscribers[data.event].forEach(fn => fn(data.payload));
});

// Usage anywhere else in the project
subscribeToEvent(event1, payload => { // notice we can directly deal with Payload instead of Message
  // payload is of type Payload1
});
```

## Other usages

### Payload type guards
Ensures that the payload is indeed of the correct type using your own type guard definition when checking.
This parameter would usually be useful only in dev or when debugging.
If you rely on this type guard for production code to work, I would suggest refactoring the message-passing protocol.

```ts
interface Payload1 {
  var1: string;
}
function isPayload1(obj: any): obj is Payload1 {
  return obj.var1 !== undefined;
}
const event1 = TypedPayloadFactory.define<Payload1>("event 1", isPayload1);

const data = {
  event: "event 1",
  payload: {
    wrongVar1: "value",
  },
}
if (event1.check(data)) { // false
  // not executed
}
```

### Typed payload without payload
Yes you read it right.
In some cases, we wish to pass events without payload.
Although this library provides little value-add for such use cases, the ability to create typed payload without payload can help with a consistent coding style.

```ts
const event1 = TypedPayloadFactory.defineNoPayload("event 1");

const message = event1.create();

if (event1.check(message)) {
  // do something without payload
}
```
