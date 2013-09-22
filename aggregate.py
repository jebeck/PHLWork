import numpy as np
import pandas as pd
import sys
import json

def main():

	data = pd.read_csv(sys.argv[1])

	grouped = data.groupby(['homeTract', 'workTract', 'industry'])
	agged = grouped.agg(np.sum)

	# prefixes for the 11 counties of the PHL metropolitan area
	to_include = ['42101', '42045', '42091', '42017', '42029', '10003', '34015', '34007', '34033', '34005', '24015']

	homeTracts = {}

	for i in agged.index:
		tract = i[0]
		work = i[1]
		industry = i[2]
		if str(tract)[:5] in to_include:
			try:
				homeTracts[tract][work][industry] = int(agged.ix[i])
			except KeyError:
				try:
					homeTracts[tract][work] = {industry: int(agged.ix[i])}
				except KeyError:
					homeTracts[tract] = {work: {industry: int(agged.ix[i])}}

	dmps = json.dumps(homeTracts, sort_keys=True, indent=4, separators=(',', ': '))

	with open(sys.argv[2] + '-agged-excluded.json', 'w') as f:
		print >> f, dmps

if __name__ == '__main__':
	main()