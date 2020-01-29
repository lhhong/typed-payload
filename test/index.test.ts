import { TypedPayloadFactory } from "../src";

interface ExampleType {
  example: string;
}

function isExampleType(obj: any): obj is ExampleType {
  return obj.example !== undefined;
}

test("Should create specified typed payload", () => {
  const examplePayloadDef = TypedPayloadFactory.define<ExampleType>("example event 1");
  const exampleTypedPayload = examplePayloadDef.create({ example: "example value"});

  expect(exampleTypedPayload).toStrictEqual({
    event: "example event 1",
    payload: {
      example: "example value",
    },
  });
});

test("Should pass check if created from the same payload def", () => {
  const examplePayloadDef = TypedPayloadFactory.define<ExampleType>("example event 2");
  const exampleTypedPayload = examplePayloadDef.create({ example: "example value"});

  expect(examplePayloadDef.check(exampleTypedPayload)).toBeTruthy();
});

test("Should pass check from external data", () => {
  const examplePayloadDef = TypedPayloadFactory.define<ExampleType>("example event 3");

  expect(examplePayloadDef.check({
    event: "example event 3",
    payload: {
      example: "example value",
    }
  })).toBeTruthy();
});

test("Should fail check with wrong event", () => {
  const examplePayloadDef = TypedPayloadFactory.define<ExampleType>("example event 4");

  expect(examplePayloadDef.check({
    event: "wrong example event 4",
    payload: {
      example: "example value",
    }
  })).toBeFalsy();
});

test("Should pass check with typeGuard defined", () => {
  const examplePayloadDef = TypedPayloadFactory.define<ExampleType>("example event 5", isExampleType);

  expect(examplePayloadDef.check({
    event: "example event 5",
    payload: {
      example: "example value",
    }
  })).toBeTruthy();
});

test("Should fail check if typeGuard fail", () => {
  const examplePayloadDef = TypedPayloadFactory.define<ExampleType>("example event 6", isExampleType);

  expect(examplePayloadDef.check({
    event: "example event 6",
    payload: {
      wrongExample: "example value",
    }
  })).toBeFalsy();
});

test("Should fail check using different payload def", () => {
  const examplePayloadDef = TypedPayloadFactory.define<ExampleType>("example event 7", isExampleType);
  const anotherPayloadDef = TypedPayloadFactory.define<ExampleType>("example event 8", isExampleType);
  const exampleTypedPayload = examplePayloadDef.create({ example: "example value"});

  expect(anotherPayloadDef.check(exampleTypedPayload)).toBeFalsy();
});

test("Should emit warning if the same event is used", () => {
  spyOn(console, "warn");

  TypedPayloadFactory.define<ExampleType>("example event 9", isExampleType);
  TypedPayloadFactory.define<ExampleType>("example event 9", isExampleType);

  expect(console.warn).toBeCalledTimes(1);
});

test("Should create no payload event", () => {
  const exampleNoPayloadDef = TypedPayloadFactory.defineNoPayload("example event 10");
  const exampleTypedNoPayload = exampleNoPayloadDef.create();

  expect(exampleTypedNoPayload).toStrictEqual({
    event: "example event 10",
  })
});

test("Should pass check with no payload event", () => {
  const exampleNoPayloadDef = TypedPayloadFactory.defineNoPayload("example event 11");

  expect(exampleNoPayloadDef.check({
    event: "example event 11",
  })).toBeTruthy();
});

test("Should fail check with wrong no payload event", () => {
  const exampleNoPayloadDef = TypedPayloadFactory.defineNoPayload("example event 12");

  expect(exampleNoPayloadDef.check({
    event: "wrong example event 12",
  })).toBeFalsy();
});