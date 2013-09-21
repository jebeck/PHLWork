PHLWork
=======

How Phila+ gets to work.

Census API docs
===============


//this one works!
http://api.census.gov/data/2011/acs5?key=18c25589ab04dc4824ae869f4c5c48b21ed57618&get=B01003_001E,B02001_003E&for=tract:016400&in=state:42+county:101

base: http://api.census.gov/data/2011/acs5?key=18c25589ab04dc4824ae869f4c5c48b21ed57618

Parameters:

get=[ACS table number],[ACS table number]....

for=[geography]

in=[geography]

For and In parameters use below:

tract:[6 digit geoid]
state:[two digit code]
county:[X digit code]

for multiple geographies (ie, county in state):

state:XX+county:XXX (plus sign in middle)
