# typed-payload
[![npm](https://img.shields.io/npm/v/typed-payload.svg?style=flat-square)](https://www.npmjs.com/package/typed-payload)
Library to provide strong typing for any form of event based payload.

## Motivation
In asynchronous programming, a common design pattern is to have a broker which passes messages from the producer to the consumer, which can be in the same process or in completely different machines. 
In a simple implementation, this message-passing goes through a multi-purpose channel (Even in complex implementations, it is often still a multi-purpose channel at the low-level view). 
It is common to create data types such as `{ event: <event>, payload: <actual message> }` to use the same channel for different events.
However, due to the channel being multi-purpose, it handles different events and hence difficult to manage typing information of the payload.

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

const payload2: Payload2 = {
  var2: "value",
};
ws.send({
  event: "event 2",
  payload: payload2,
}: Message2);
```

##### Consumer:
```ts
ws.on("message", (data) => {
  if (data.event === "event 1") {
    // Handle "event 1" using data.payload
  }
  if (data.event === "event 2") {
    // Handle "event 2" using data.payload
  }
})
```

The consumer will not be able to infer the type of `data.payload` resulting in the need to perform unsafe casting.

A solution could be to make use of type guards, adding functions to type check `Message1` or `Message2` but leads to high overhead and error prone type definitions.

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

const payload2: Payload2 = {
  var2: "value",
};
ws.send(event2.create(payload2));
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
})
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
  return obj.var !== undefined;
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
