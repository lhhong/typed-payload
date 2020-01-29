/**
 * Payload typed with the event
 */
export interface TypedPayload<T> {
  event: string;
  payload: T;
}

/**
 * Empty payload typed with the event
 */
export interface TypedNoPayload {
  event: string;
}

/**
 * Type definition object of an event with payload
 */
export interface PayloadTypeDef<T> {
  readonly event: string;
  /**
   * Creates a TypedPayload object for use in your program
   * @param payload Payload of the message
   */
  readonly create: (payload: T) => TypedPayload<T>;
  /**
   * Checks if obj is of the correct TypedPayload
   * @param obj Object to type check
   */
  readonly check: (obj: any) => obj is TypedPayload<T>;
}

class PayloadTypeDefClass<T> {
  constructor(
    public readonly event: string,
    private readonly typeGuard?: (payload: any) => boolean,
  ) {}

  public create(payload: T): TypedPayload<T> {
    return { event: this.event, payload };
  }

  public check(obj: any): obj is TypedPayload<T> {
    return (
      obj !== undefined &&
      obj.event !== undefined &&
      obj.event === this.event &&
      obj.payload !== undefined &&
      (this.typeGuard === undefined || this.typeGuard(obj.payload))
    );
  }
}

/**
 * Type definition object of an event without payload
 */
export interface NoPayloadTypeDef {
  readonly event: string;
  /**
   * Creates a TypedNoPayload object for use in your program
   */
  readonly create: () => TypedNoPayload;
  /**
   * Checks if obj is of the correct TypedNoPayload
   * @param obj Object to type check
   */
  readonly check: (obj: any) => obj is TypedNoPayload;
}

class NoPayloadTypeDefClass {
  constructor(
    public readonly event: string
  ) {}

  /**
   * Creates a TypedNoPayload object for use in your program
   */
  public create(): TypedNoPayload {
    return { event: this.event };
  }

  /**
   * Checks if obj is the correct TypedNoPayload
   * @param obj Object to type check
   */
  public check(obj: any | undefined): obj is TypedNoPayload {
    return obj !== undefined && obj.event !== undefined && obj.event === this.event;
  }
}

class TypedPayloadFactoryClass {

  private registeredTypes: { [event: string]: boolean } = {};

  /**
   * Creates an event definition with a payload of type T
   * @param event Name of event
   * @param typeGuard Type guard function of the payload
   */
  public define<T>(event: string, typeGuard?: (payload: any) => boolean): PayloadTypeDef<T> {
    this.checkRepeatedTypes(event);
    return new PayloadTypeDefClass<T>(event, typeGuard);
  }

  /**
   * Creates an event definition without payload
   * @param event Name of event
   */
  public defineNoPayload(event: string): NoPayloadTypeDef {
    this.checkRepeatedTypes(event);
    return new NoPayloadTypeDefClass(event);
  }

  private checkRepeatedTypes(event: string) {
    if (this.registeredTypes[event]) {
      console.warn(`Conflicting event definition of "${event}" detected. Type assertion may result in false positives.
      Please resolve conflicting definitions.`);
    }
    this.registeredTypes[event] = true;
  }

}

export const TypedPayloadFactory = new TypedPayloadFactoryClass();
