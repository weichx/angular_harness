#Harness Vue Proposal

###Why
In our front-end architecture group we all agreed that harnessing components and developing / testing them in isolation is a good thing.
We also liked that data can be easily mocked and applications written before a backend is ready / saturated with usable data.
However, our current harness setup has a few issues, first and foremost is that it was targeted at angular
which we are no longer using. The other issue I've noticed with it is that because the syntax for defining harnesses and mocks is rather verbose
(and often requires creating a handful of other files), people aren't using it as often as they could be even if they see the value of it. 

###Possible Solutions

1. Drop the harness/mock development pattern all together

2. Adapt harness to work with Vue and create a generator to build the files we are creating by hand right now. 
   Harness was written with extensibility in mind, creating a new client interface for it would be about a days worth of work.
   The generator would probably take another half day or so depending on how complex we want it to be
   
3. Learn from our experience with Harness v2 and build Harness v3 

### Goals for harness v3

- Break the relationship between mocks and harnesses, saving mock sets on a global level instead of a per harness level.
This will help with some boilerplate and confusion we currently deal with.

- Make harnessing simple components extremely easy

- Reduce the verbosity we currently deal with. We can do this by assuming more defaults than we do now

- Make positioning of the component trivial without the need for custom dom structure per harness

- Make the structures and functions [Context, Group, Harness, Variant, Mock, MockSet] easier to understand

### Possible new interface for harness
```javascript
//simple case
@autoharness // generates a generic harness and expose it to the harness client. no-op in production
export class MyVueComponent {}

//slightly more involved case
var component1Harness = Harness.create('harnessName', {
    component: MyVueComponent, //reference to component you want to use, ignored if `template` option is provided
    position: 'center', //auto generate surrounding dom structure / styles to horizontally center 
    size: '30%', //how much of the page do we take up with this component, essentially defining parent bounds
    //data is defined for the 'parent' to be passed into the child component.
    //if you follow the right naming conventions data is automatically linked into dom attributes for you
    //<my-component rx="rx", user-address="userAddress"/>. data can also be a function that returns a data 
    //object. this would handle the use case where you have a list of components each taking their own 
    //distinct data using the same data construction
    data: {
        'rx': RxFactory.create(),
        'userAddress': AddressFactory.create()
    },
    //if this is provided, `component` key is ignored. this lets you build a harness for nested componenets, do your own
    //data -> attribute mapping, put some additional dom structure in, whatever you want that isnt provided out of the 
    //box by the framework can happen here.
    template: '<my-component></my-component>',
    beforeCreate: function() {
      //this function is arbitrary code you can run and do whatever you like before the
      //harness creates the component(s).
      //you can optionally return a promise
    }
});

//you can extend a harness to supply different options (including components) 
//or remove options (by setting to null) or add new options
var componentHarness2 = Harness.extend('harness name', component1Harness, {
    component: MyOtherComponent,
    data: extend(component2Harness.data, {
        //use the data from the other harness and add a new attribute
        userId: 'my_user_id'
    })
});

```

#### Mocks
You probably noticed nothing about the harness definition includes any mention of mocked out data. I think the right way
to handle mocking data is to let the dependency injector own mocking from start to finish. To do this you first define your mocks through the injector, then optionally define a collection of mocks that you want applied all at once.
Multiple collections of mocks can be added a the same time, overlaps are resolved based first on the order in which you
applied them. This makes testing nicer because you just apply the pre-created set of mocks instead of defining per harness what it is you want mocked. Here is an initial pass at what that might look like:

```javascript
//for simple synchronous things just pass a value to the `mock` function
//mock(mockedProviderName : string, mockName : string, implementation : any) => any
var mock1 = Injector.mock('x-wing.lasers', 'Blue Lasers', LaserFactory.create('blue'));

//optionally we can define asynchronous mocks (this should be rare)
//mockAsync(mockedProviderName : string, mockName : string, dependencies: Array<string>, implementation : any) => any

//dependencies can be injected by providing an array of provider names. Once all depdencies have been
//resolved the implementation function is invoked with dependencies ordinally defined.
var mock2 = Injector.mockAsync('x-wing.engines', 'Slow Engines', ['Wrench', 'Screw'], function(wrench : Wrench, screw : Screw) {
   return http.get('fake/engine_factory/engines/slow');
});

var mock = Injector.getMock('providerName', 'mockName');
mock.apply(); //start using this mock

var mockGroup = Injector.defineMockGroup('groupName', {
   providerName: 'mockName',
   'xwing.lasers': 'Blue Lasers',
   'xwing.engines': 'Slow Engines'
});

mockGroup.apply(); 
//or
Injector.applyMockGroup('groupName');

//unset an entire mock group
Injector.removeMockGroup('groupName');

//unset single mock and go back to using the real provider
Injector.removeMock('xwing.lasers')

//get an individual mock implementation
Injector.getMock('providerName', 'mockName');

//use a mock in a unit test

it('should mock then unmock xwing lasers', function(done : DoneFn) {
   Injector.provide('xwing.lasers', Color.Orange);
   var mock = Injector.mock('xwing.lasers', 'Blue', Color.Blue);
   //or
   var mock = Injector.getMock('xwing.lasers', 'Blue');
   mock.apply();
   Injector.create(XWing).then(function(xwing : XWing) {
      expect(xwing.lasers.color).toBe(Color.Blue);
      mock.remove();
      return Injector.create(XWing);
   }).then(function(xwing : XWing) {
      expect(xwing.lasers.color).toBe(Color.Orange);
      done();
   });
});
```

### All together now

To use a mock or mock group with a harness from code:

```javascript
var harness = Harness.create('example', {
   component: XWingDisplay,
   beforeCreate() {
      Injector.applyMockGroup('mockGroup');
   }
});
```

Generally though mock groups would be set via a similar UI to what we have now.

## Development commitment
I think implementing and testing the above framework will take less than a week. The injector and mocking system already exists (mostly) in the [Needle](https://github.com/weichx/Needle) library. The harness client UI will need a small revamp but that shouldnt be major. The harness api proposed above is fairly simple to implement with Vue. Essentially we just generate a parent component for the harnessed component and map the data appropriately. Styles / Dom templates for sizing and positioning are trivial and used all over our other projects so we can just borrow them.

## Where to go from here
I hope this gives a reasonable overview of what harness v3 might look like, I'd love to have a pro-con discussion about a.) whether we should do this or not and b.) how api interface feels for both harness and injection. The depdendency injection and mocking library here is assumed to be the [Needle](https://github.com/weichx/Needle) library I wrote a few weeks ago. I didn't find any other standalone dependency injection libraries that were extensible, asynchronous and easy to integrate into our infrastructure / development paradigms but if someone knows of another one we should evaluate please let me know.

I think comments on this file are a good way for us to start this discussion and decide if its worth getting the entire group together again to discuss this in more detail. Thanks for reading, happy coding!
