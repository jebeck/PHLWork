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

	homeTracts = {str(i[0]): {'workTracts': []} for i in agged.index if str(i[0])[:5] in to_include}

	for i in agged.index:
		homeTract = str(i[0])
		workTract = str(i[1])
		industry = i[2]
		try:
			ht = homeTracts[homeTract]
			workTracts = ht['workTracts']
			found = False
			for t in workTracts:
				if t['workTract'] == workTract:
					ind = t['industries']
					ind[i[2]] = int(agged.ix[i])
					found = True
			else:
				if not found:
					workTracts.append({'workTract': workTract, 'industries': {i[2]: int(agged.ix[i])}})
		except KeyError:
			continue

	dmps = json.dumps(homeTracts, sort_keys=True, separators=(',', ':'))

	with open(sys.argv[2] + '-agged-excluded.json', 'w') as f:
		print >> f, dmps

if __name__ == '__main__':
	main()